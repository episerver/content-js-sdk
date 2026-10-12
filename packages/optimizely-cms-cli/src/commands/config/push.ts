import { Args, Flags } from '@oclif/core';
import * as path from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { BaseCommand } from '../../baseCommand.js';
import { writeFile, access } from 'node:fs/promises';
import { createApiClient } from '../../service/cmsRestClient.js';
import {
  findMetaData,
  logList,
  readFromPath,
  normalizePropertyGroups,
  validateApplications,
} from '../../service/utils.js';
import { checkApplications } from '../../service/applicationService.js';
import { mapContentToManifest } from '../../mapper/contentToPackage.js';
import { pathToFileURL } from 'node:url';
import { constants } from 'node:fs';
import { translateErrorMessage } from '../../utils/errors.js';
import {
  contractToManifest,
  validateContentAreaConstraints,
} from '../../utils/mapping.js';
import { syncLocales } from '../../service/localeService.js';
import {
  findUnknownKeys,
  parseOnlyKeys,
  scopeManifest,
} from '../../utils/scopeManifest.js';

const exitWithOnlyError = (message: string): never => {
  console.error(chalk.red(message));
  console.error(
    chalk.dim(
      'Use the keys of content types, contracts or display templates, separated by commas.',
    ),
  );
  return process.exit(1);
};

const keysOf = (items: { key: string }[]) => items.map(it => it.key);
const displayNamesOf = (items: { displayName: string }[]) =>
  items.map(it => it.displayName);

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
    only: Flags.string({
      description:
        'comma-separated keys of the content types, contracts or display templates to push',
    }),
  };
  static override description =
    'Push content type definitions to the CMS from a configuration file';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./custom-config.mjs',
    '<%= config.bin %> <%= command.id %> --force',
    '<%= config.bin %> <%= command.id %> --only Hero,LandingPage',
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigPush);
    const configFilePath = path.resolve(process.cwd(), args.file);
    const onlyKeys = parseOnlyKeys(flags.only);

    if (onlyKeys?.length === 0) exitWithOnlyError('--only requires at least one key');

    // a scoped push lists only what it sends, not everything found in the config
    const log = !onlyKeys;

    // Check if config file exists
    try {
      await access(configFilePath, constants.R_OK);
    } catch {
      console.error(chalk.red(`Configuration file not found: ${configFilePath}`));
      console.error(chalk.dim(`Make sure the file exists and is readable.`));
      process.exit(1);
    }

    const configPath = pathToFileURL(configFilePath).href;

    const { componentPaths, propertyGroups, applications, content, locale } =
      await readFromPath(configPath);

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
      { log },
    );

    // Validate content area constraints
    const { errors: constraintErrors } = validateContentAreaConstraints(contentTypes);
    if (constraintErrors.length > 0) {
      console.error(
        chalk.red(
          `\nInvalid content type configuration (${constraintErrors.length} ${constraintErrors.length === 1 ? 'issue' : 'issues'} found):`,
        ),
      );
      for (const error of constraintErrors) {
        console.error(chalk.red(`  ✖ ${error}`));
      }
      console.error(
        chalk.dim(
          '\n  Resolve the issues above and run the command again. Nothing was pushed to the CMS.\n',
        ),
      );
      process.exit(1);
    }

    // Validate and normalize property groups
    const normalizedPropertyGroups =
      propertyGroups ? normalizePropertyGroups(propertyGroups) : [];
    if (log) logList('Property Groups found', displayNamesOf(normalizedPropertyGroups));

    // Convert contracts to manifest shape
    const manifestContracts = contracts.map(contractToManifest);
    const validatedApplications = applications ? validateApplications(applications) : [];
    if (log) logList('Applications found', displayNamesOf(validatedApplications));

    // Check if apps have entryPoint set (will be mapped from content config)
    const hasAppsWithoutEntryPoint = validatedApplications.some(app => !app.entryPoint);

    // Validate that content array is configured if applications exist without entryPoint
    if (hasAppsWithoutEntryPoint && !content) {
      console.error(
        chalk.red(
          'Content configuration required when applications defined without entryPoint',
        ),
      );
      console.error(
        chalk.dim(
          'Either configure entryPoint in application OR configure content array',
        ),
      );
      process.exit(1);
    }

    const fullMetaData = {
      contentTypes: mapContentToManifest(contentTypes).concat(manifestContracts),
      displayTemplates,
      propertyGroups: normalizedPropertyGroups,
    };

    // Scope the manifest to the --only keys
    const unknownKeys = findUnknownKeys(fullMetaData, onlyKeys ?? []);

    if (unknownKeys.length > 0)
      exitWithOnlyError(`Unknown keys in --only: ${unknownKeys.join(', ')}`);

    const metaData = onlyKeys ? scopeManifest(fullMetaData, onlyKeys) : fullMetaData;

    if (onlyKeys) {
      logList('Pushing content types', keysOf(metaData.contentTypes));
      logList('Pushing display templates', keysOf(metaData.displayTemplates));
      logList('Pushing property groups', keysOf(metaData.propertyGroups));
    }

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

    // Locales and applications are global, so a scoped push leaves them alone
    if (!onlyKeys && Array.isArray(locale) && locale.length > 0)
      await syncLocales(locale, restClient);

    // Check and ensure applications (skips if all exist)
    if (!onlyKeys) await checkApplications(validatedApplications, content, flags.host);

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
