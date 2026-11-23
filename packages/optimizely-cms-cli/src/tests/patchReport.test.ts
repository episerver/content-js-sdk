import { describe, test, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { stripVTControlCharacters } from 'node:util';
import { printConflictDetails, printPatchReport } from '../utils/patchReport.js';
import type { ItemStatus } from '../utils/patchStatus.js';

const noSyncs = { applications: false, locales: false };
const teammate = {
  lastModifiedBy: 'teammate@example.com',
  lastModified: '2026-11-23T10:43:26.2394424+00:00',
};

describe('patch report', () => {
  let log: MockInstance;

  const printedLines = () => log.mock.calls.map(([line]) => stripVTControlCharacters(line));

  beforeEach(() => {
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  describe('printPatchReport', () => {
    const report = (statuses: ItemStatus[], syncs = noSyncs, serverChanges = {}) => {
      printPatchReport({ statuses, serverChanges, syncs });
      return printedLines();
    };

    test('prints one section per status, with aligned item columns and blank lines between', () => {
      expect(
        report(
          [
            { id: 'contentTypes:Hero', status: 'changed' },
            { id: 'propertyGroups:seo', status: 'new' },
            { id: 'contentTypes:Tile', status: 'conflict', reason: 'bothChanged' },
            { id: 'displayTemplates:Row', status: 'conflict', reason: 'deletedOnServer' },
            { id: 'contentTypes:SmallFeature', status: 'outdated' },
            { id: 'contentTypes:Old', status: 'deletedOnServer' },
            { id: 'contentTypes:Gone', status: 'removed' },
          ],
          noSyncs,
          { 'contentTypes:Tile': teammate, 'contentTypes:SmallFeature': teammate },
        ),
      ).toEqual([
        'To push (2)',
        '  Hero (content type)          changed',
        '  seo (property group)         new',
        '',
        'Conflicts — changed locally and on the server (1)',
        '  Tile (content type)          by teammate@example.com  2026-11-23 10:43 UTC',
        '',
        'Conflicts — changed locally, deleted on the server (1)',
        '  Row (display template)',
        '',
        'Changed on the server — run config pull to see it (1)',
        '  SmallFeature (content type)  by teammate@example.com  2026-11-23 10:43 UTC',
        '',
        'Deleted on the server — not recreated (1)',
        '  Old (content type)',
        '',
        'Still in the CMS — removed from your config, not deleted (1)',
        '  Gone (content type)',
      ]);
    });

    test('lists the settings to sync and counts up-to-date items', () => {
      expect(
        report(
          [
            { id: 'contentTypes:Hero', status: 'unchanged' },
            { id: 'contentTypes:Banner', status: 'inSync' },
            { id: 'contentTypes:Stale', status: 'gone' },
          ],
          { applications: true, locales: true },
        ),
      ).toEqual(['To sync: applications, locales', '', '2 up to date']);
    });

    test('keeps a timestamp it cannot parse as it is', () => {
      const [, line] = report(
        [{ id: 'contentTypes:Hero', status: 'outdated' }],
        noSyncs,
        { 'contentTypes:Hero': { lastModified: 'yesterday' } },
      );

      expect(line).toBe('  Hero (content type)  yesterday');
    });

    test('prints nothing when there is nothing to report', () => {
      expect(report([])).toEqual([]);
    });
  });

  describe('printConflictDetails', () => {
    test('lists every differing field under its item, with aligned columns', () => {
      printConflictDetails({
        conflicts: [
          { id: 'contentTypes:Hero', status: 'conflict', reason: 'bothChanged' },
          { id: 'displayTemplates:Row', status: 'conflict', reason: 'deletedOnServer' },
        ],
        serverChanges: { 'contentTypes:Hero': teammate },
        localItems: {
          'contentTypes:Hero': { displayName: 'Hero', properties: { title: { maxLength: 80 } } },
          'displayTemplates:Row': { nodeType: 'row' },
        },
        serverItems: {
          'contentTypes:Hero': { displayName: 'Hero (teammate)', properties: { title: {} } },
        },
      });

      expect(printedLines()).toEqual([
        'Conflict details',
        '  Hero (content type) — changed locally and on the server, by teammate@example.com  2026-11-23 10:43 UTC',
        '    displayName                 local: "Hero"  server: "Hero (teammate)"',
        '    properties.title.maxLength  local: 80      server: (not set)',
        '  Row (display template) — changed locally, deleted on the server',
      ]);
    });

    test('shortens long values', () => {
      printConflictDetails({
        conflicts: [{ id: 'contentTypes:Hero', status: 'conflict', reason: 'noState' }],
        serverChanges: {},
        localItems: { 'contentTypes:Hero': { description: 'x'.repeat(100) } },
        serverItems: { 'contentTypes:Hero': {} },
      });

      const [detail] = printedLines().filter(line => line.includes('description'));
      expect(detail).toContain(`local: "${'x'.repeat(58)}…`);
    });
  });
});
