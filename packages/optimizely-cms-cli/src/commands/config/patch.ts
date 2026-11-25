import { Args, Flags } from '@oclif/core';
import * as path from 'node:path';
import chalk from 'chalk';
import { confirm, select } from '@inquirer/prompts';
import { BaseCommand } from '../../baseCommand.js';
import { createApiClient } from '../../service/cmsRestClient.js';
import { checkApplications } from '../../service/applicationService.js';
import {
  findMissingContent,
  processContentWithApplications,
  type ContentConfig,
} from '../../service/contentService.js';
import { deleteItems } from '../../service/deleteService.js';
import { findLocalesToSync, syncLocales } from '../../service/localeService.js';
import {
  buildManifest,
  fetchManifest,
  uploadManifest,
} from '../../service/manifestService.js';
import { readPatchState, recordState } from '../../service/patchState.js';
import { reportImportResult } from '../../utils/errors.js';
import { isInteractive, pluralize } from '../../utils/general.js';
import {
  hashApplications,
  hashItems,
  normalizeManifest,
  pickItems,
} from '../../utils/normalizeManifest.js';
import { classifyItems, hasStatus, type ItemStatus } from '../../utils/patchStatus.js';
import {
  printConflictDetails,
  printPatchReport,
  serverChangesOf,
} from '../../utils/patchReport.js';

type ConflictChoice = 'overwrite' | 'skip' | 'abort';

const SHOW_CHOICE = { name: 'Show the differences', value: 'show' as const };
const DECISION_CHOICES: { name: string; value: ConflictChoice }[] = [
  { name: 'Overwrite them with the local version', value: 'overwrite' },
  { name: 'Skip them and push the rest', value: 'skip' },
  { name: 'Abort without pushing anything', value: 'abort' },
];

const idsOf = (statuses: ItemStatus[]) => statuses.map(it => it.id);

const noContent: ContentConfig[] = [];

const askAboutConflicts = <T extends string>(
  count: number,
  choices: { name: string; value: T }[],
) =>
  select<T>({
    message: `Conflicting changes in ${count} ${pluralize(count, 'item')}. What should patch do?`,
    choices,
  });

const askForDecision = async (
  count: number,
  showDetails: () => void,
): Promise<ConflictChoice> => {
  const choice = await askAboutConflicts(count, [SHOW_CHOICE, ...DECISION_CHOICES]);

  if (choice !== 'show') return choice;

  showDetails();
  // the details never change, so they are offered once
  return askAboutConflicts(count, DECISION_CHOICES);
};

const exitOnConflicts = (): never => {
  console.error(chalk.red('\nNothing was pushed because of the conflicts above.'));
  console.error(
    chalk.dim(
      'Run config pull to review the server version, then use --overwrite to push the local version or --skipConflicts to push the rest.',
    ),
  );
  return process.exit(1);
};

const resolveConflicts = async (
  count: number,
  flags: { overwrite: boolean; skipConflicts: boolean },
  showDetails: () => void,
): Promise<ConflictChoice> => {
  if (count === 0 || flags.overwrite) return 'overwrite';
  if (flags.skipConflicts) return 'skip';
  if (isInteractive()) {
    const choice = await askForDecision(count, showDetails);
    return choice === 'abort' ? exitOnConflicts() : choice;
  }

  // without a prompt the details are the only way to see what blocks the push
  showDetails();
  return exitOnConflicts();
};

const shouldDeleteRemoved = async (count: number, deleteRemoved: boolean) => {
  if (count === 0) return false;
  if (deleteRemoved) return true;
  if (isInteractive())
    return confirm({
      message: `Delete the ${count} ${pluralize(count, 'item')} removed from your config from the CMS? This cannot be undone.`,
      default: false,
    });

  console.log(
    chalk.dim('Pass --deleteRemoved to delete the items that are still in the CMS.'),
  );
  return false;
};

export default class ConfigPatch extends BaseCommand<typeof ConfigPatch> {
  static override args = {
    file: Args.string({
      description: 'configuration file',
      default: './optimizely.config.mjs',
    }),
  };
  static override flags = {
    dryRun: Flags.boolean({
      description: 'report what would be pushed without sending anything to the server',
    }),
    force: Flags.boolean({
      description:
        'Force updates the content type even though the changes might result in data loss.',
    }),
    overwrite: Flags.boolean({
      description:
        'push items that also changed on the server, replacing the server version',
      exclusive: ['skipConflicts'],
    }),
    skipConflicts: Flags.boolean({
      description: 'push everything except items that also changed on the server',
      exclusive: ['overwrite'],
    }),
    deleteRemoved: Flags.boolean({
      description:
        'delete items removed from the config that are still in the CMS, without asking',
    }),
  };
  static override description =
    'Push only the content types, display templates and property groups that changed since the last push';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --dryRun',
    '<%= config.bin %> <%= command.id %> --skipConflicts',
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigPatch);
    const configFilePath = path.resolve(process.cwd(), args.file);

    const { manifest, applications, content, locale } = await buildManifest(
      configFilePath,
      { log: false },
    );

    // hashed before syncing: the application sync fills in entry points and preview formats
    const applicationHashes = hashApplications(applications);

    const restClient = await createApiClient(flags.host);
    // content and locales are only ever created, so the CMS itself says which are missing
    const [serverManifest, stored, missingContent, localesToSync] = await Promise.all([
      fetchManifest(restClient),
      readPatchState(configFilePath, flags.host),
      // like push, content is only synced when the config has applications
      applications.length > 0 ? findMissingContent(content, restClient) : noContent,
      findLocalesToSync(locale, restClient),
    ]);

    const localItems = normalizeManifest(manifest);
    const serverItems = normalizeManifest(serverManifest);
    const localHashes = hashItems(localItems);
    const statuses = classifyItems(localHashes, hashItems(serverItems), stored.items);
    const serverChanges = serverChangesOf(serverManifest);

    const changedApplications = applications.filter(
      it => applicationHashes[String(it.key)] !== stored.applications?.[String(it.key)],
    );
    // missing content is created, and a synced application needs the content it uses as entry point
    const neededKeys = new Set([
      ...missingContent.map(it => it.key),
      ...changedApplications.map(it => it.entryPoint),
    ]);
    const contentToSync = content.filter(it => neededKeys.has(it.key));
    const syncs = {
      applications: { items: changedApplications, firstSync: !stored.applications },
      content: missingContent,
      locales: localesToSync,
    };
    const syncsApplications = changedApplications.length > 0;
    const syncsContent = missingContent.length > 0;
    const syncsLocales = localesToSync.length > 0;

    printPatchReport({
      statuses,
      serverChanges,
      syncs,
      // content is only checked when the config has applications
      checked: {
        applications: applications.length,
        content: applications.length > 0 ? content.length : 0,
        locales: locale.length,
      },
    });

    if (flags.dryRun) return;

    const conflicts = statuses.filter(hasStatus('conflict'));
    const choice = await resolveConflicts(conflicts.length, flags, () =>
      printConflictDetails({ conflicts, serverChanges, localItems, serverItems }),
    );
    const pushIds = idsOf([
      ...statuses.filter(hasStatus('changed', 'new')),
      ...(choice === 'overwrite' ? conflicts : []),
    ]);

    if (choice === 'skip')
      console.warn(
        chalk.yellow(
          `Skipping ${conflicts.length} conflicting ${pluralize(conflicts.length, 'item')}.`,
        ),
      );

    // every question comes before the first change
    const removed = statuses.filter(hasStatus('removed'));
    const deletesRemoved = await shouldDeleteRemoved(removed.length, flags.deleteRemoved);

    if (
      pushIds.length === 0 &&
      !syncsApplications &&
      !syncsContent &&
      !syncsLocales &&
      !deletesRemoved
    )
      console.log(chalk.green('Nothing to push.'));

    const result =
      pushIds.length > 0 ?
        await uploadManifest(restClient, pickItems(manifest, pushIds), flags.force)
      : undefined;
    if (syncsLocales) await syncLocales(locale, restClient);

    // unchanged applications and existing content are left alone, like unchanged content types
    if (syncsApplications)
      await checkApplications(changedApplications, contentToSync, flags.host);
    else if (syncsContent)
      await processContentWithApplications(contentToSync, [], flags.host);
    if (result) reportImportResult(result);

    const deleteOutcomes =
      deletesRemoved ? await deleteItems(restClient, idsOf(removed)) : {};
    // an item already missing from the CMS is as good as deleted
    const deletedIds = Object.keys(deleteOutcomes).filter(
      id => deleteOutcomes[id] !== 'failed',
    );

    if (Object.values(deleteOutcomes).includes('failed')) process.exitCode = 1;

    const update = {
      local: localHashes,
      record: [...pushIds, ...idsOf(statuses.filter(hasStatus('inSync')))],
      drop: [...idsOf(statuses.filter(hasStatus('gone'))), ...deletedIds],
      ...(syncsApplications ? { applications: applicationHashes } : {}),
    };

    // anything pushed is also in `record`
    const changesState =
      update.record.length > 0 || update.drop.length > 0 || syncsApplications;

    // after an upload the server copy is read back; otherwise the fetched one is current
    if (changesState)
      await recordState(
        configFilePath,
        flags.host,
        restClient,
        update,
        result ? undefined : hashItems(serverItems),
      );
  }
}
