import { describe, test, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { stripVTControlCharacters } from 'node:util';
import { printConflictDetails, printPatchReport } from '../utils/patchReport.js';
import type { ItemStatus } from '../utils/patchStatus.js';

const noSyncs = { applications: false, locales: false };
const teammate = { lastModifiedBy: 'teammate@example.com' };

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

    test('groups items by what patch does with them, under one heading per explanation', () => {
      expect(
        report([
          { id: 'contentTypes:Hero', status: 'changed' },
          { id: 'contentTypes:Banner', status: 'changed' },
          { id: 'propertyGroups:seo', status: 'new' },
          { id: 'displayTemplates:Row', status: 'conflict', reason: 'deletedOnServer' },
          { id: 'contentTypes:Old', status: 'deletedOnServer' },
          { id: 'contentTypes:Gone', status: 'removed' },
        ]),
      ).toEqual([
        'To push:',
        '  Changed:',
        '    Hero (content type)',
        '    Banner (content type)',
        '  New:',
        '    seo (property group)',
        'Conflicts:',
        '  Changed locally, deleted on the server:',
        '    Row (display template)',
        'Changed on the server:',
        '  Deleted on the server (not recreated):',
        '    Old (content type)',
        'Removed locally:',
        '  Removed locally, still in the CMS:',
        '    Gone (content type)',
      ]);
    });

    test('groups conflicts by who changed them, keeping each time on its item', () => {
      const lines = report(
        [
          { id: 'contentTypes:Hero', status: 'conflict', reason: 'bothChanged' },
          { id: 'contentTypes:Banner', status: 'conflict', reason: 'bothChanged' },
        ],
        noSyncs,
        {
          'contentTypes:Hero': { ...teammate, lastModified: '2026-11-23T10:00:00Z' },
          'contentTypes:Banner': teammate,
        },
      );

      expect(lines).toEqual([
        'Conflicts:',
        '  Changed locally and on the server by teammate@example.com:',
        '    Hero (content type) at 2026-11-23T10:00:00Z',
        '    Banner (content type)',
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
      ).toEqual(['To sync:', '  applications, locales', '2 up to date']);
    });

    test('prints nothing when there is nothing to report', () => {
      expect(report([])).toEqual([]);
    });
  });

  describe('printConflictDetails', () => {
    test('lists every differing field under its item, aligned', () => {
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
        'Conflict details:',
        '  Changed locally and on the server by teammate@example.com:',
        '    Hero (content type)',
        '      displayName                 local: "Hero"  server: "Hero (teammate)"',
        '      properties.title.maxLength  local: 80  server: (not set)',
        '  Changed locally, deleted on the server:',
        '    Row (display template)',
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
