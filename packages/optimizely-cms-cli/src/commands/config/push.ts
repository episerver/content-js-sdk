import { Args, Flags } from '@oclif/core';
import * as path from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { BaseCommand } from '../../baseCommand.js';
import { writeFile, access } from 'node:fs/promises';
import { createApiClient } from '../../service/cmsRestClient.js';
import {
  findMetaData,
  readFromPath,
  normalizePropertyGroups,
  validateApplications,
} from '../../service/utils.js';
import { ensureStartPageContent } from '../../service/contentService.js';
import { ensureApplication, getApplication } from '../../service/applicationService.js';
import { mapContentToManifest } from '../../mapper/contentToPackage.js';
import { pathToFileURL } from 'node:url';
import { constants } from 'node:fs';
import { translateErrorMessage } from '../../utils/errors.js';
import { contractToManifest } from '../../utils/mapping.js';

export default class ConfigPush extends BaseCommand<typeof ConfigPush> {
  static override args = {
    file: Args.string({
      description: 'configuration file',
      default: './optimizely.config.mjs',
    }),
  };
  static override flags = {
    output: Flags.string({ description: 'if passed, write the manifest JSON' }),
    dryRun: Flags.boolean({
      description: 'do not send anything to the server',
    }),
    force: Flags.boolean({
      description:
        'Force updates the content type even though the changes might result in data loss.',
    }),
  };
  static override description =
    'Push content type definitions to the CMS from a configuration file';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./custom-config.mjs',
    '<%= config.bin %> <%= command.id %> --force',
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigPush);
    const configFilePath = path.resolve(process.cwd(), args.file);

    // Check if config file exists
    try {
      await access(configFilePath, constants.R_OK);
    } catch {
      console.error(chalk.red(`Configuration file not found: ${configFilePath}`));
      console.error(chalk.dim(`Make sure the file exists and is readable.`));
      process.exit(1);
    }

    const configPath = pathToFileURL(configFilePath).href;

    let componentPaths: string[];
    let propertyGroups: any;
    let applications: any;
    let startPage: any;

    try {
      componentPaths = await readFromPath(configPath, 'components');
      propertyGroups = await readFromPath(configPath, 'propertyGroups');
      applications = await readFromPath(configPath, 'applications');
      startPage = await readFromPath(configPath, 'startPage');
    } catch (error) {
      console.error(chalk.red('Failed to read configuration file'));
      if (error instanceof Error) {
        console.error(chalk.dim(error.message));
      }
      throw error;
    }

    // Validate components field
    if (!componentPaths || !Array.isArray(componentPaths)) {
      console.error(
        chalk.red('Invalid configuration: "components" field must be an array'),
      );
      process.exit(1);
    }

    //the pattern is relative to the config file
    const configPathDirectory = pathToFileURL(path.dirname(configFilePath)).href;

    // extracts metadata(contentTypes, displayTemplates, contracts) from the component paths
    const { contentTypes, displayTemplates, contracts } = await findMetaData(
      componentPaths,
      configPathDirectory,
    );

    // Validate and normalize property groups
    const normalizedPropertyGroups =
      propertyGroups ? normalizePropertyGroups(propertyGroups) : [];

    // Convert contracts to manifest shape
    const manifestContracts = contracts.map(contractToManifest);
    const validatedApplications = applications ? validateApplications(applications) : [];

    // Validate that startPage is configured if applications exist
    if (validatedApplications.length > 0 && !startPage) {
      console.error(chalk.red('StartPage must be configured when applications are defined'));
      console.error(
        chalk.dim('Applications require entryPoint which is auto-generated from startPage content'),
      );
      process.exit(1);
    }

    const metaData = {
      contentTypes: mapContentToManifest(contentTypes).concat(manifestContracts),
      displayTemplates,
      propertyGroups: normalizedPropertyGroups,
    };

    const restClient = await createApiClient(flags.host);

    if (flags.output) {
      try {
        await writeFile(flags.output, JSON.stringify(metaData, null, 2));
        console.info(chalk.green(`Configuration file written to '${flags.output}'`));
      } catch (error) {
        console.error(chalk.red(`Failed to write output file: ${flags.output}`));
        if (error instanceof Error) {
          console.error(chalk.dim(error.message));
        }
        process.exit(1);
      }
    }

    if (flags.dryRun) {
      return;
    }

    if (flags.force) {
      console.warn(
        `${chalk.yellowBright.bold(
          '--force',
        )} is used!. This forces content type updates, which may result in data loss`,
      );
    }

    const spinner = ora('Uploading configuration file').start();

    const response = await restClient.POST('/manifest', {
      headers: {
        accept: 'application/json',
        'content-type': 'application/vnd.optimizely.cms.v1.manifest+json',
      },
      body: metaData as any,
      params: {
        header: {
          'cms-ignore-data-loss-warnings': flags.force,
        },
      },
    });

    if (response.error) {
      spinner.fail(chalk.red(' Error'));
      console.error(
        chalk.red(
          `Error ${response.error.status}: ${response.error.title || 'Unknown error'} (${response.error.code || 'N/A'})`,
        ),
      );
      if (response.error.detail) {
        console.error(chalk.dim(response.error.detail));
      }
      if (response.error.errors?.length) {
        for (const [index, err] of response.error.errors.entries()) {
          console.error(`  - ERROR ${index + 1}`);
          console.error(chalk.dim(`      [DETAIL] ${err.detail}`));
          console.error(chalk.dim(`      [FIELD]  ${err.field}\n`));
        }
      }
      process.exit(1);
    }

    spinner.succeed(chalk.green('Configuration file uploaded'));

    if (!response.data) {
      console.error(chalk.red('The server did not respond with any content'));
      process.exit(1);
    }

    const data = response.data;

    // Handle application creation if configured (AFTER manifest push)
    if (validatedApplications.length > 0) {
      for (const app of validatedApplications) {
        const appSpinner = ora(`Checking application "${app.displayName}"`).start();
        try {
          // Check if application already exists first
          const existingApp = await getApplication(app.key!, flags.host);

          if (existingApp) {
            // Application exists - use its existing entryPoint
            appSpinner.succeed(
              chalk.green(`Application "${app.displayName}" already exists (${app.key})`),
            );
            continue; // Skip content creation and app creation
          }

          // Application doesn't exist - need to create start page content first
          let startPageContentRef: string | undefined;

          if (startPage && startPage.key) {
            const contentSpinner = ora(`Creating start page content "${startPage.key}"`).start();
            try {
              const result = await ensureStartPageContent(startPage, flags.host);
              startPageContentRef = result.contentRef;

              if (result.existed) {
                contentSpinner.succeed(
                  chalk.green(
                    `Start page content "${startPage.key}" already exists at ${startPageContentRef}`,
                  ),
                );
              } else {
                contentSpinner.succeed(
                  chalk.green(
                    `Start page content "${startPage.key}" created at ${startPageContentRef}`,
                  ),
                );
              }

              // Set application entryPoint to content reference
              app.entryPoint = startPageContentRef;
              console.log(
                chalk.dim(
                  `  Set application "${app.displayName}" entryPoint to ${startPageContentRef}`,
                ),
              );
            } catch (error) {
              contentSpinner.fail(chalk.red(`Failed to create start page content`));
              throw error;
            }
          }

          // Set default previewUrlFormats if not provided
          if (!app.previewUrlFormats) {
            app.previewUrlFormats = {
              any: '{host}/preview?key={key}&ver={version}&loc={locale}&ctx={context}',
            };
          }

          // Now create the application
          const result = await ensureApplication(app, flags.host);
          appSpinner.succeed(
            chalk.green(`Application "${app.displayName}" created (${result.key})`),
          );
        } catch (error) {
          appSpinner.fail(chalk.red(`Failed to ensure application "${app.displayName}"`));
          if (error instanceof Error) {
            console.error(chalk.red(error.message));
          }
          throw error;
        }
      }
    }
    if (data.outcomes && data.outcomes.length > 0) {
      console.log(chalk.cyan.bold('\nOutcomes:'));
      for (const r of data.outcomes) {
        console.log(chalk.dim('  -'), chalk.blue(r.message));
      }
    }

    if (data.errors && data.errors.length > 0) {
      console.log(chalk.red.bold('\nErrors:'));
      for (const r of data.errors) {
        const errorMessage = translateErrorMessage(r);
        console.log(chalk.dim('  -'), chalk.red(errorMessage));
      }
      process.exit(1);
    }
  }
}

