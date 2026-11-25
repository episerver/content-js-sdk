import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { printConflictDetails, printPatchReport } from '../utils/patchReport.js';
import type { ItemStatus } from '../utils/patchStatus.js';
import { printed, silenceConsole } from './helpers.js';

const noSyncs: Parameters<typeof printPatchReport>[0]['syncs'] = {
  applications: { items: [], total: 0, firstSync: false },
  content: { items: [], total: 0 },
  locales: { items: [], total: 0 },
};
const teammate = {
  lastModifiedBy: 'teammate@example.com',
  lastModified: '2026-11-23T10:43:26.2394424+00:00',
};

describe('patch report', () => {
  let consoleSpies: ReturnType<typeof silenceConsole>;

  const printedLines = () => {
    const output = printed(consoleSpies.log);
    return output === '' ? [] : output.split('\n');
  };

  beforeEach(() => {
    consoleSpies = silenceConsole();
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
        'Still in the CMS — removed from your config (1)',
        '  Gone (content type)',
      ]);
    });

    test('lists the settings to sync with the reason, and counts up-to-date items', () => {
      expect(
        report(
          [
            { id: 'contentTypes:Hero', status: 'unchanged' },
            { id: 'contentTypes:Banner', status: 'inSync' },
            { id: 'contentTypes:Stale', status: 'gone' },
          ],
          {
            applications: {
              items: [{ key: 'blog_app', displayName: 'Blog App' }],
              total: 1,
              firstSync: false,
            },
            content: { items: [{ key: 'BlogContent', displayName: 'Blog' }], total: 1 },
            locales: { items: ['en', 'sv'], total: 2 },
          },
        ),
      ).toEqual([
        'Applications to sync — changed since the last push (1)',
        '  blog_app (Blog App)',
        '',
        'Content to create — missing in the CMS (1)',
        '  BlogContent (Blog)',
        '',
        'Locales to sync — missing or disabled in the CMS (2)',
        '  en',
        '  sv',
        '',
        'Up to date: 2 items',
      ]);
    });

    test('sums up every kind of setting checked that needs nothing', () => {
      const syncs = {
        applications: { items: [], total: 2, firstSync: false },
        content: { items: [], total: 1 },
        locales: { items: ['sv'], total: 2 },
      };

      expect(report([{ id: 'contentTypes:Hero', status: 'unchanged' }], syncs)).toEqual([
        'Locales to sync — missing or disabled in the CMS (1)',
        '  sv',
        '',
        'Up to date: 1 item, 2 applications, 1 content item, 1 locale',
      ]);
    });

    test('says when there is no saved state to compare applications with', () => {
      const applications = {
        items: [{ key: 'site', displayName: 'Site' }],
        total: 1,
        firstSync: true,
      };

      expect(report([], { ...noSyncs, applications })).toEqual([
        'Applications to sync — no saved state (1)',
        '  site (Site)',
      ]);
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
          'contentTypes:Hero': {
            displayName: 'Hero',
            properties: { title: { maxLength: 80 } },
          },
          'displayTemplates:Row': { nodeType: 'row' },
        },
        serverItems: {
          'contentTypes:Hero': {
            displayName: 'Hero (teammate)',
            properties: { title: {} },
          },
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
