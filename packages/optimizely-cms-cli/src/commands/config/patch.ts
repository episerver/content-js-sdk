import { Args, Flags } from '@oclif/core';
import * as path from 'node:path';
import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { BaseCommand } from '../../baseCommand.js';
import { createApiClient } from '../../service/cmsRestClient.js';
import { checkApplications } from '../../service/applicationService.js';
import { syncLocales } from '../../service/localeService.js';
import {
  buildManifest,
  fetchManifest,
  uploadManifest,
} from '../../service/manifestService.js';
import { readPatchState, savePatchState } from '../../service/patchState.js';
import { reportImportResult } from '../../utils/errors.js';
import { isInteractive } from '../../utils/general.js';
import {
  hashManifest,
  hashValue,
  normalizeManifest,
  pickItems,
} from '../../utils/normalizeManifest.js';
import { classifyItems, needsSync, type ItemStatus } from '../../utils/patchStatus.js';
import {
  printConflictDetails,
  printPatchReport,
  serverChangesOf,
} from '../../utils/patchReport.js';

type ConflictChoice = 'overwrite' | 'skip' | 'abort';

const idsWith = (statuses: ItemStatus[], ...wanted: ItemStatus['status'][]) =>
  statuses.filter(it => wanted.includes(it.status)).map(it => it.id);

const SHOW_CHOICE = { name: 'Show the differences', value: 'show' as const };
const DECISION_CHOICES: { name: string; value: ConflictChoice }[] = [
  { name: 'Overwrite them with the local version', value: 'overwrite' },
  { name: 'Skip them and push the rest', value: 'skip' },
  { name: 'Abort without pushing anything', value: 'abort' },
];

const askAboutConflicts = <T extends string>(
  count: number,
  choices: { name: string; value: T }[],
) =>
  select<T>({
    message: `${count} ${count === 1 ? 'item has' : 'items have'} conflicting changes. What should patch do?`,
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
      {
        log: false,
      },
    );

    // hashed before syncing: the application sync fills in entry points and preview formats
    const applicationsHash = hashValue({ applications, content });
    const localesHash = hashValue(locale ?? []);

    const restClient = await createApiClient(flags.host);
    const serverManifest = await fetchManifest(restClient);
    const stored = await readPatchState(configFilePath, flags.host);

    const localHashes = hashManifest(manifest);
    const statuses = classifyItems(
      localHashes,
      hashManifest(serverManifest),
      stored.items,
    );
    // the syncs only add and update, so an empty setting never needs one
    const syncs = {
      applications:
        applications.length > 0 && needsSync(applicationsHash, stored.applications),
      locales:
        Array.isArray(locale) &&
        locale.length > 0 &&
        needsSync(localesHash, stored.locales),
    };

    const serverChanges = serverChangesOf(serverManifest);
    const showConflictDetails = () =>
      printConflictDetails({
        conflicts: statuses.filter(it => it.status === 'conflict'),
        serverChanges,
        localItems: normalizeManifest(manifest),
        serverItems: normalizeManifest(serverManifest),
      });

    printPatchReport({ statuses, serverChanges, syncs });

    const conflicts = idsWith(statuses, 'conflict');
    const choice = await this.resolveConflicts(
      conflicts.length,
      flags,
      showConflictDetails,
    );
    const pushIds = [
      ...idsWith(statuses, 'changed', 'new'),
      ...(choice === 'overwrite' ? conflicts : []),
    ];

    if (choice === 'skip' && conflicts.length > 0 && !flags.dryRun)
      console.warn(chalk.yellow(`Skipping ${conflicts.length} conflicting item(s).`));

    if (pushIds.length === 0 && !syncs.applications && !syncs.locales)
      console.log(chalk.green('Nothing to push.'));

    if (flags.dryRun) return;

    const result =
      pushIds.length > 0 ?
        await uploadManifest(restClient, pickItems(manifest, pushIds), flags.force)
      : undefined;
    const localesSynced = syncs.locales && (await syncLocales(locale, restClient));

    if (syncs.applications) await checkApplications(applications, content, flags.host);
    if (result) reportImportResult(result);

    const record = [...pushIds, ...idsWith(statuses, 'inSync')];
    const drop = idsWith(statuses, 'gone');

    if (record.length === 0 && drop.length === 0 && !syncs.applications && !localesSynced)
      return;

    await savePatchState(configFilePath, flags.host, {
      local: localHashes,
      server: hashManifest(result ? await fetchManifest(restClient) : serverManifest),
      record,
      drop,
      ...(syncs.applications ? { applications: applicationsHash } : {}),
      ...(localesSynced ? { locales: localesHash } : {}),
    });
  }

  private async resolveConflicts(
    count: number,
    flags: { overwrite: boolean; skipConflicts: boolean; dryRun: boolean },
    showDetails: () => void,
  ): Promise<ConflictChoice> {
    if (count === 0 || flags.overwrite) return 'overwrite';
    if (flags.skipConflicts || flags.dryRun) return 'skip';
    if (isInteractive()) {
      const choice = await askForDecision(count, showDetails);
      return choice === 'abort' ? exitOnConflicts() : choice;
    }

    // without a prompt the details are the only way to see what blocks the push
    showDetails();
    return exitOnConflicts();
  }
}
