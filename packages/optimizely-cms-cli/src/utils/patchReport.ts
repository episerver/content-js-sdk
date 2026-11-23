import chalk, { type ChalkInstance } from 'chalk';
import {
  diffItems,
  itemId,
  parseItemId,
  SECTIONS,
  type FieldDifference,
  type ManifestSection,
} from './normalizeManifest.js';
import type { ConflictReason, ItemStatus } from './patchStatus.js';

/** Who last changed an item on the server, as reported by the CMS */
export type ServerChange = { lastModified?: string; lastModifiedBy?: string };

/** Collects who last changed each item of a server manifest, keyed by item id. */
export const serverChangesOf = (
  manifest: Partial<Record<ManifestSection, (ServerChange & { key?: string })[] | null>>,
): Record<string, ServerChange> =>
  Object.fromEntries(
    SECTIONS.flatMap(section =>
      (manifest[section] ?? []).map(({ key, lastModified, lastModifiedBy }) => [
        itemId(section, key),
        { lastModified, lastModifiedBy },
      ]),
    ),
  );

type ReportInput = {
  statuses: ItemStatus[];
  serverChanges: Record<string, ServerChange>;
  syncs: { applications: boolean; locales: boolean };
};

type DetailsInput = {
  conflicts: ItemStatus[];
  serverChanges: Record<string, ServerChange>;
  localItems: Record<string, unknown>;
  serverItems: Record<string, unknown>;
};

// one reported item: items sharing a heading are listed under it once
type Entry = { heading: string; item: string; details?: string[] };

const SECTION_LABELS: Record<ManifestSection, string> = {
  contentTypes: 'content type',
  displayTemplates: 'display template',
  propertyGroups: 'property group',
};

const MAX_VALUE_LENGTH = 60;

const byWhom = (change?: ServerChange) =>
  change?.lastModifiedBy ? ` by ${change.lastModifiedBy}` : '';

const CONFLICT_HEADINGS: Record<ConflictReason, (change?: ServerChange) => string> = {
  bothChanged: change => `Changed locally and on the server${byWhom(change)}`,
  deletedOnServer: () => 'Changed locally, deleted on the server',
  noState: () => 'Differs from the server, with no saved state to tell which side changed',
};

const headingOf = (status: ItemStatus, change?: ServerChange): string => {
  switch (status.status) {
    case 'conflict':
      return CONFLICT_HEADINGS[status.reason](change);
    case 'outdated':
      return `Changed on the server${byWhom(change)} (run config pull to see the changes)`;
    case 'deletedOnServer':
      return 'Deleted on the server (not recreated)';
    case 'removed':
      return 'Removed locally, still in the CMS';
    case 'new':
      return 'New';
    default:
      return 'Changed';
  }
};

// the time differs per item, so it goes on the item line rather than the heading
const showsServerTime = (status: ItemStatus) =>
  status.status === 'outdated' || (status.status === 'conflict' && status.reason === 'bothChanged');

const describeItem = (status: ItemStatus, change?: ServerChange) => {
  const { section, key } = parseItemId(status.id);
  const time = showsServerTime(status) && change?.lastModified ? ` at ${change.lastModified}` : '';

  return `${key} (${SECTION_LABELS[section]})${time}`;
};

const toEntry = (status: ItemStatus, change?: ServerChange): Entry => ({
  heading: headingOf(status, change),
  item: describeItem(status, change),
});

const formatEntries = (entries: Entry[], color: ChalkInstance) =>
  [...new Set(entries.map(it => it.heading))].flatMap(heading => [
    color(`  ${heading}:`),
    ...entries
      .filter(it => it.heading === heading)
      .flatMap(it => [`    ${it.item}`, ...(it.details ?? []).map(line => `      ${line}`)]),
  ]);

const GROUPS: { title: string; color: ChalkInstance; statuses: ItemStatus['status'][] }[] = [
  { title: 'To push', color: chalk.green, statuses: ['changed', 'new'] },
  { title: 'Conflicts', color: chalk.red, statuses: ['conflict'] },
  { title: 'Changed on the server', color: chalk.yellow, statuses: ['outdated', 'deletedOnServer'] },
  { title: 'Removed locally', color: chalk.yellow, statuses: ['removed'] },
];

const formatGroup = (
  { title, color, statuses: groupStatuses }: (typeof GROUPS)[number],
  { statuses, serverChanges }: ReportInput,
) => {
  const entries = statuses
    .filter(it => groupStatuses.includes(it.status))
    .map(it => toEntry(it, serverChanges[it.id]));

  return entries.length > 0 ? [color.bold(`${title}:`), ...formatEntries(entries, color)] : [];
};

const formatSyncs = ({ applications, locales }: ReportInput['syncs']) => {
  const names = [applications && 'applications', locales && 'locales'].filter(Boolean);
  return names.length > 0 ? [chalk.green.bold('To sync:'), chalk.green(`  ${names.join(', ')}`)] : [];
};

const formatValue = (value: unknown) => {
  if (value === undefined) return '(not set)';

  const text = JSON.stringify(value);
  return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH - 1)}…` : text;
};

const formatDifferences = (differences: FieldDifference[]) => {
  const width = Math.max(...differences.map(it => it.path.length));

  return differences.map(
    ({ path, local, server }) =>
      `${chalk.dim(path.padEnd(width))}  local: ${formatValue(local)}  server: ${formatValue(server)}`,
  );
};

/** Prints the classified items, grouped by what patch does with them. */
export const printPatchReport = (input: ReportInput) => {
  const upToDate = input.statuses.filter(it => ['unchanged', 'inSync'].includes(it.status));
  const lines = [
    ...GROUPS.flatMap(group => formatGroup(group, input)),
    ...formatSyncs(input.syncs),
    ...(upToDate.length > 0 ? [chalk.dim(`${upToDate.length} up to date`)] : []),
  ];

  lines.forEach(line => console.log(line));
};

/** Prints, per conflicting item, every field whose local and server values differ. */
export const printConflictDetails = ({
  conflicts,
  serverChanges,
  localItems,
  serverItems,
}: DetailsInput) => {
  const entries = conflicts.map(it => ({
    ...toEntry(it, serverChanges[it.id]),
    // an item deleted on the server has nothing to compare against
    details:
      serverItems[it.id] ? formatDifferences(diffItems(localItems[it.id], serverItems[it.id])) : [],
  }));
  const lines = [chalk.red.bold('Conflict details:'), ...formatEntries(entries, chalk.red)];

  lines.forEach(line => console.log(line));
};
