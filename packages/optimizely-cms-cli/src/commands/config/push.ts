import { Args, Flags } from '@oclif/core';
import * as path from 'node:path';
import chalk from 'chalk';
import { BaseCommand } from '../../baseCommand.js';
import { writeFile } from 'node:fs/promises';
import { createApiClient } from '../../service/cmsRestClient.js';
import { logList } from '../../service/utils.js';
import { checkApplications } from '../../service/applicationService.js';
import { syncLocales } from '../../service/localeService.js';
import { buildManifest, uploadManifest } from '../../service/manifestService.js';
import { recordState } from '../../service/patchState.js';
import { reportImportResult } from '../../utils/errors.js';
import { hashManifest, hashSettings } from '../../utils/normalizeManifest.js';
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
    const { manifest, applications, content, locale } = await buildManifest(
      configFilePath,
      { log: !onlyKeys },
    );

    const unknownKeys = findUnknownKeys(manifest, onlyKeys ?? []);

    if (unknownKeys.length > 0)
      exitWithOnlyError(`Unknown keys in --only: ${unknownKeys.join(', ')}`);

    const metaData = onlyKeys ? scopeManifest(manifest, onlyKeys) : manifest;

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

    // hashed before syncing: the application sync fills in entry points and preview formats
    const settingsHashes = hashSettings({ applications, content, locale });
    const localHashes = hashManifest(metaData);

    const result = await uploadManifest(restClient, metaData, flags.force);

    // Locales and applications are global, so a scoped push leaves them alone
    const localesSynced = !onlyKeys && (await syncLocales(locale, restClient));

    // Check and ensure applications (skips if all exist)
    if (!onlyKeys) await checkApplications(applications, content, flags.host);

    reportImportResult(result);

    await recordState(configFilePath, flags.host, restClient, {
      local: localHashes,
      record: Object.keys(localHashes),
      ...(onlyKeys ? {} : { applications: settingsHashes.applications }),
      ...(localesSynced ? { locales: settingsHashes.locales } : {}),
    });
  }
}
