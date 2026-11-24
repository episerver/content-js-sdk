import chalk, { type ChalkInstance } from 'chalk';
import { pluralize } from './general.js';
import {
  diffItems,
  mapItemsById,
  parseItemId,
  type FieldDifference,
  type ManifestSection,
} from './normalizeManifest.js';
import { hasStatus, type ConflictReason, type ItemStatus } from './patchStatus.js';

/** Who last changed an item on the server, as reported by the CMS */
export type ServerChange = { lastModified?: string; lastModifiedBy?: string };

/** Collects who last changed each item of a server manifest, keyed by item id. */
export const serverChangesOf = (
  manifest: Partial<Record<ManifestSection, (ServerChange & { key?: string })[] | null>>,
): Record<string, ServerChange> =>
  mapItemsById(manifest, ({ lastModified, lastModifiedBy }) => ({
    lastModified,
    lastModifiedBy,
  }));

type Named = { key?: string; displayName?: string };

type ReportInput = {
  statuses: ItemStatus[];
  serverChanges: Record<string, ServerChange>;
  syncs: {
    // changed applications, and whether there is no saved state to compare them with
    applications: { items: Named[]; firstSync: boolean };
    // content items and locales missing in the CMS
    content: Named[];
    locales: string[];
  };
  // how many settings of each kind were checked, for the up-to-date summary
  checked: { applications: number; content: number; locales: number };
};

type DetailsInput = {
  conflicts: ItemStatus[];
  serverChanges: Record<string, ServerChange>;
  localItems: Record<string, unknown>;
  serverItems: Record<string, unknown>;
};

type ReportSection = {
  heading: string;
  color: ChalkInstance;
  matches: (status: ItemStatus) => boolean;
  // what differs per item, shown in a column after its name
  describe?: (change: ServerChange | undefined, status: ItemStatus) => string;
};

const SECTION_LABELS: Record<ManifestSection, string> = {
  contentTypes: 'content type',
  displayTemplates: 'display template',
  propertyGroups: 'property group',
};

const CONFLICT_REASONS: Record<ConflictReason, string> = {
  bothChanged: 'changed locally and on the server',
  deletedOnServer: 'changed locally, deleted on the server',
  noState: 'differs from the server, with no saved state to tell which side changed',
};

const MAX_VALUE_LENGTH = 60;

const labelOf = (id: string) => {
  const { section, key } = parseItemId(id);
  return `${key} (${SECTION_LABELS[section]})`;
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : (
      `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
    );
};

const whoAndWhen = (change?: ServerChange) =>
  [
    change?.lastModifiedBy && `by ${change.lastModifiedBy}`,
    change?.lastModified && formatTime(change.lastModified),
  ]
    .filter(Boolean)
    .join('  ');

const isConflict = (reason: ConflictReason) => (status: ItemStatus) =>
  status.status === 'conflict' && status.reason === reason;

const REPORT_SECTIONS: ReportSection[] = [
  {
    heading: 'To push',
    color: chalk.blue,
    matches: hasStatus('changed', 'new'),
    describe: (_, status) => status.status,
  },
  ...(Object.keys(CONFLICT_REASONS) as ConflictReason[]).map(reason => ({
    heading: `Conflicts — ${CONFLICT_REASONS[reason]}`,
    color: chalk.yellow,
    matches: isConflict(reason),
    describe: reason === 'bothChanged' ? whoAndWhen : undefined,
  })),
  {
    heading: 'Changed on the server — run config pull to see it',
    color: chalk.yellow,
    matches: hasStatus('outdated'),
    describe: whoAndWhen,
  },
  {
    heading: 'Deleted on the server — not recreated',
    color: chalk.yellow,
    matches: hasStatus('deletedOnServer'),
  },
  {
    heading: 'Still in the CMS — removed from your config, not deleted',
    color: chalk.cyan,
    matches: hasStatus('removed'),
  },
];

const formatSection = (
  { heading, color, matches, describe }: ReportSection,
  { statuses, serverChanges }: ReportInput,
  labelWidth: number,
) => {
  const items = statuses.filter(matches);
  const itemLine = (status: ItemStatus) =>
    `  ${labelOf(status.id).padEnd(labelWidth)}  ${chalk.dim(describe?.(serverChanges[status.id], status) ?? '')}`.trimEnd();

  return items.length > 0 ?
      [color.bold(`${heading} (${items.length})`), ...items.map(itemLine)]
    : [];
};

const formatSync = <T>(heading: string, items: T[], labelOfItem: (item: T) => string) =>
  items.length > 0 ?
    [
      chalk.blue.bold(`${heading} (${items.length})`),
      ...items.map(it => `  ${labelOfItem(it)}`),
    ]
  : [];

const keyAndName = (it: Named) => `${it.key} (${it.displayName})`;

const formatSyncs = ({ applications, content, locales }: ReportInput['syncs']) => [
  formatSync(
    `Applications to sync — ${applications.firstSync ? 'no saved state' : 'changed since the last push'}`,
    applications.items,
    keyAndName,
  ),
  formatSync('Content to create — missing in the CMS', content, keyAndName),
  formatSync('Locales to sync — missing or disabled in the CMS', locales, it => it),
];

const formatValue = (value: unknown) => {
  if (value === undefined) return '(not set)';

  const text = JSON.stringify(value);
  return text.length > MAX_VALUE_LENGTH ?
      `${text.slice(0, MAX_VALUE_LENGTH - 1)}…`
    : text;
};

const formatDifferences = (differences: FieldDifference[]) => {
  const rows = differences.map(it => ({
    path: it.path,
    local: formatValue(it.local),
    server: formatValue(it.server),
  }));
  const pathWidth = Math.max(...rows.map(it => it.path.length));
  const localWidth = Math.max(...rows.map(it => it.local.length));

  return rows.map(
    ({ path, local, server }) =>
      `    ${chalk.dim(path.padEnd(pathWidth))}  local: ${local.padEnd(localWidth)}  server: ${server}`,
  );
};

// everything checked that needs nothing, e.g. "26 items, 2 applications, 1 locale"
const formatUpToDate = ({ statuses, syncs, checked }: ReportInput) => {
  const counts: [number, string][] = [
    [statuses.filter(hasStatus('unchanged', 'inSync')).length, 'item'],
    [checked.applications - syncs.applications.items.length, 'application'],
    [checked.content - syncs.content.length, 'content item'],
    [checked.locales - syncs.locales.length, 'locale'],
  ];
  const parts = counts
    .filter(([count]) => count > 0)
    .map(([count, noun]) => `${count} ${pluralize(count, noun)}`);

  return parts.length > 0 ? [chalk.dim(`Up to date: ${parts.join(', ')}`)] : [];
};

const conflictReasonOf = (status: ItemStatus) =>
  status.status === 'conflict' ? CONFLICT_REASONS[status.reason] : '';

/** Prints the classified items, one section per status, separated by blank lines. */
export const printPatchReport = (input: ReportInput) => {
  const reported = input.statuses.filter(it =>
    REPORT_SECTIONS.some(section => section.matches(it)),
  );
  const labelWidth = Math.max(0, ...reported.map(it => labelOf(it.id).length));
  const blocks = [
    ...REPORT_SECTIONS.map(section => formatSection(section, input, labelWidth)),
    ...formatSyncs(input.syncs),
    formatUpToDate(input),
  ].filter(block => block.length > 0);

  blocks.forEach((block, index) => {
    if (index > 0) console.log('');
    block.forEach(line => console.log(line));
  });
};

/** Prints, per conflicting item, every field whose local and server values differ. */
export const printConflictDetails = ({
  conflicts,
  serverChanges,
  localItems,
  serverItems,
}: DetailsInput) => {
  const lines = conflicts.flatMap(it => {
    const reason = [conflictReasonOf(it), whoAndWhen(serverChanges[it.id])]
      .filter(Boolean)
      .join(', ');

    return [
      `  ${labelOf(it.id)} ${chalk.dim(`— ${reason}`)}`,
      // an item deleted on the server has nothing to compare against
      ...(serverItems[it.id] ?
        formatDifferences(diffItems(localItems[it.id], serverItems[it.id]))
      : []),
    ];
  });

  [chalk.yellow.bold('Conflict details'), ...lines].forEach(line => console.log(line));
};
