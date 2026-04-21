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
} from '../../service/utils.js';
import { mapContentToManifest } from '../../mapper/contentToPackage.js';
import { pathToFileURL } from 'node:url';
import { constants } from 'node:fs';
import { translateErrorMessage } from '../../utils/errors.js';

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

    try {
      componentPaths = await readFromPath(configPath, 'components');
      propertyGroups = await readFromPath(configPath, 'propertyGroups');
    } catch (error) {
      console.error(chalk.red('Failed to read configuration file'));
      if (error instanceof Error) {
        console.error(chalk.dim(error.message));
      }
      throw error;
    }

    // Validate components field
    if (!componentPaths || !Array.isArray(componentPaths)) {
      console.error(chalk.red('Invalid configuration: "components" field must be an array'));
      process.exit(1);
    }

    //the pattern is relative to the config file
    const configPathDirectory = pathToFileURL(
      path.dirname(configFilePath),
    ).href;

    // extracts metadata(contentTypes, displayTemplates) from the component paths
    const { contentTypes, displayTemplates } = await findMetaData(
      componentPaths,
      configPathDirectory,
    );

    // Validate and normalize property groups
    const normalizedPropertyGroups = propertyGroups
      ? normalizePropertyGroups(propertyGroups)
      : [];

    const metaData = {
      contentTypes: mapContentToManifest(contentTypes),
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

    const response = await restClient.POST('/experimental/packages', {
      headers: {
        accept: 'application/json',
        'content-type': 'application/vnd.optimizely.cms.v1.manifest+json',
      },
      body: metaData as any,
      params: {
        query: {
          ignoreDataLossWarnings: flags.force,
        },
      },
    });

    if (response.error) {
      if (response.error.status === 404) {
        spinner.fail(chalk.red('Feature Not Active'));
        console.error(
          chalk.red(
            'The requested feature "preview3_packages_enabled" is not enabled in your environment.',
          ),
        );
        console.error(
          chalk.dim(
            'Please contact your system administrator or support team to request that this feature be enabled.',
          ),
        );
      } else {
        spinner.fail(chalk.red('Error'));
        console.error(
          chalk.red(
            `Error ${response.error.status}: ${response.error.title || 'Unknown error'} (${response.error.code || 'N/A'})`,
          ),
        );
        if (response.error.detail) {
          console.error(chalk.dim(response.error.detail));
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
    if (data.outcomes && data.outcomes.length > 0) {
      console.log(chalk.cyan.bold('\nOutcomes:'));
      for (const r of response.data?.outcomes ?? []) {
        console.log(chalk.dim('  -'), chalk.blue(r.message));
      }
    }

    if (data.warnings && data.warnings.length > 0) {
      console.log(chalk.yellow.bold('\nWarnings:'));
      for (const r of data.warnings) {
        console.log(chalk.dim('  -'), chalk.yellow(r.message));
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
