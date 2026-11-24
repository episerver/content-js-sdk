import { Args, Flags } from '@oclif/core';
import * as path from 'node:path';
import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { BaseCommand } from '../../baseCommand.js';
import { createApiClient } from '../../service/cmsRestClient.js';
import type { ApplicationsType } from '@optimizely/cms-sdk/buildConfig';
import { checkApplications } from '../../service/applicationService.js';
import {
  processContentWithApplications,
  type ContentConfig,
} from '../../service/contentService.js';
import { syncLocales } from '../../service/localeService.js';
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

// the syncs only add and update, so only changed applications, added content and added
// locales need one; content an application being synced points at is needed for its entry point
const findSettingsToSync = (
  {
    applications,
    content,
    locale,
  }: { applications: ApplicationsType[]; content: ContentConfig[]; locale: string[] },
  applicationHashes: Record<string, string>,
  stored: Awaited<ReturnType<typeof readPatchState>>,
) => {
  const changedApplications = applications.filter(
    it => applicationHashes[String(it.key)] !== stored.applications?.[String(it.key)],
  );
  const usedContentKeys = new Set(changedApplications.map(it => it.entryPoint));
  // like push, content is only synced when the config has applications
  const newContent =
    applications.length > 0 ? content.filter(it => !stored.content?.includes(it.key)) : [];

  return {
    syncs: {
      applications: { items: changedApplications, firstSync: !stored.applications },
      content: { items: newContent, firstSync: !stored.content },
      locales: {
        items: locale.filter(it => !stored.locales?.includes(it)),
        firstSync: !stored.locales,
      },
    },
    contentToSync: content.filter(it => newContent.includes(it) || usedContentKeys.has(it.key)),
  };
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
    const [serverManifest, stored] = await Promise.all([
      fetchManifest(restClient),
      readPatchState(configFilePath, flags.host),
    ]);

    const localItems = normalizeManifest(manifest);
    const serverItems = normalizeManifest(serverManifest);
    const localHashes = hashItems(localItems);
    const statuses = classifyItems(localHashes, hashItems(serverItems), stored.items);
    const serverChanges = serverChangesOf(serverManifest);
    const { syncs, contentToSync } = findSettingsToSync(
      { applications, content, locale },
      applicationHashes,
      stored,
    );
    const syncsApplications = syncs.applications.items.length > 0;
    const syncsContent = syncs.content.items.length > 0;
    const syncsLocales = syncs.locales.items.length > 0;

    printPatchReport({ statuses, serverChanges, syncs });

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

    if (pushIds.length === 0 && !syncsApplications && !syncsContent && !syncsLocales)
      console.log(chalk.green('Nothing to push.'));

    const result =
      pushIds.length > 0 ?
        await uploadManifest(restClient, pickItems(manifest, pushIds), flags.force)
      : undefined;
    const localesSynced = syncsLocales && (await syncLocales(locale, restClient));

    // unchanged applications and content are left alone, like unchanged content types
    if (syncsApplications)
      await checkApplications(syncs.applications.items, contentToSync, flags.host);
    else if (syncsContent) await processContentWithApplications(contentToSync, [], flags.host);
    if (result) reportImportResult(result);

    const contentSynced = syncsApplications || syncsContent;
    const update = {
      local: localHashes,
      record: [...pushIds, ...idsOf(statuses.filter(hasStatus('inSync')))],
      drop: idsOf(statuses.filter(hasStatus('gone'))),
      ...(syncsApplications ? { applications: applicationHashes } : {}),
      // content not synced now was synced before, so every key is current
      ...(contentSynced ? { content: content.map(it => it.key) } : {}),
      ...(localesSynced ? { locales: locale } : {}),
    };

    // anything pushed is also in `record`
    const changesState =
      update.record.length > 0 ||
      update.drop.length > 0 ||
      contentSynced ||
      localesSynced;

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
