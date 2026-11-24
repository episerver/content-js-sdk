import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { select } from '@inquirer/prompts';
import ConfigPatch from '../commands/config/patch.js';
import { createApiClient } from '../service/cmsRestClient.js';
import { buildManifest } from '../service/manifestService.js';
import { savePatchState } from '../service/patchState.js';
import { checkApplications } from '../service/applicationService.js';
import { processContentWithApplications } from '../service/contentService.js';
import { hashApplications } from '../utils/normalizeManifest.js';
import {
  ExitError,
  apiResponse,
  componentSource,
  contentTypeDefinition,
  mockApiClient,
  mockExit,
  patchStateFile,
  printed,
  silenceConsole,
  stubCmsEnv,
  writeProject,
  type MockApiClient,
} from './helpers.js';

vi.mock('../service/cmsRestClient.js', async importOriginal => ({
  ...(await importOriginal<typeof import('../service/cmsRestClient.js')>()),
  createApiClient: vi.fn(),
}));
vi.mock('@inquirer/prompts');
vi.mock('../service/applicationService.js');
vi.mock('../service/contentService.js');
vi.mock('ora', async () => ({
  default: vi.fn((await import('./helpers.js')).createSpinner),
}));

const hero = contentTypeDefinition('Hero', {
  properties: { title: { type: 'string', group: 'content' } },
});
const banner = contentTypeDefinition('Banner', {
  properties: { subtitle: { type: 'string', group: 'layout' } },
});
const editedHero = contentTypeDefinition('Hero', {
  properties: { title: { type: 'string', group: 'content', maxLength: 80 } },
});

type ServerManifest = Awaited<ReturnType<typeof buildManifest>>['manifest'];

describe('config patch', () => {
  let tempDir: string;
  let client: MockApiClient;
  let consoleSpies: ReturnType<typeof silenceConsole>;
  let server: ServerManifest;

  const patch = (...args: string[]) => ConfigPatch.run([configPath(), ...args], import.meta.url);
  const configPath = () => join(tempDir, 'optimizely.config.mjs');
  const readState = async () => readFile(patchStateFile(tempDir), 'utf8');

  const writeConfig = (components = [hero, banner], config: Record<string, unknown> = {}) =>
    writeProject(
      tempDir,
      {
        components: ['./components/*.ts'],
        propertyGroups: [{ key: 'content' }, { key: 'layout' }],
        ...config,
      },
      { 'components/Types.ts': componentSource(components) },
    );

  // the server copy of whatever the config currently produces
  const localManifest = async () => (await buildManifest(configPath(), { log: false })).manifest;

  const withServerContentType = (key: string, change: Record<string, unknown>) => ({
    ...server,
    contentTypes: server.contentTypes.map(it => (it.key === key ? { ...it, ...change } : it)),
  });

  // the lines of the report section starting with `heading`, with column padding squeezed
  const reportSection = (heading: string) => {
    const lines = printed(consoleSpies.log).split('\n');
    const start = lines.findIndex(line => line.startsWith(`${heading} (`));
    const end = lines.indexOf('', start);

    return start === -1 ? [] : (
        lines.slice(start + 1, end === -1 ? undefined : end).map(line => line.trim().replace(/\s{2,}/g, '  '))
      );
  };
  const expectReported = (heading: string, ...columns: string[]) =>
    expect(reportSection(heading)).toContain(columns.join('  '));

  const postedBody = () => client.POST.mock.calls[0][1].body;
  const postedKeys = () =>
    Object.values(postedBody() as Record<string, { key: string }[]>).flatMap(items =>
      items.map(it => it.key),
    );

  // first run against an identical server: records every item as in sync
  const baseline = async (components = [hero, banner]) => {
    await writeConfig(components);
    server = await localManifest();
    await patch();
    client.POST.mockClear();
    consoleSpies.log.mockClear();
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await mkdtemp(join(tmpdir(), 'cli-patch-'));
    client = mockApiClient();
    client.GET.mockImplementation(async (requestPath: string) =>
      requestPath === '/manifest' ?
        apiResponse({ data: server })
      : apiResponse({ data: { items: [{ key: 'en', isEnabled: true }] } }),
    );
    client.POST.mockResolvedValue(apiResponse({ data: { outcomes: [] } }));
    vi.mocked(createApiClient).mockResolvedValue(client as never);
    stubCmsEnv();
    consoleSpies = silenceConsole();
    mockExit();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    process.exitCode = undefined;
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('first run', () => {
    test('records everything and pushes nothing when the server already matches', async () => {
      await writeConfig();
      server = await localManifest();

      await patch();

      expect(client.POST).not.toHaveBeenCalled();
      expect(printed(consoleSpies.log)).toContain('Nothing to push.');
      expect(printed(consoleSpies.log)).toContain('4 up to date');
      expect(Object.keys(JSON.parse(await readState()).instances)).toHaveLength(1);
    });

    test('warns instead of failing when the state cannot be saved', async () => {
      await writeConfig();
      server = await localManifest();
      // a file where the state directory should be makes the save fail
      await writeFile(join(tempDir, '.optimizely'), '');

      await patch();

      expect(printed(consoleSpies.warn)).toContain('Could not record the state for config patch');
      expect(client.POST).not.toHaveBeenCalled();
    });

    test('pushes only the items missing on the server, without their property groups', async () => {
      await writeConfig();
      const local = await localManifest();
      server = { ...local, contentTypes: local.contentTypes.filter(it => it.key === 'Hero') };

      await patch();

      expect(postedBody()).toEqual({
        contentTypes: [expect.objectContaining({ key: 'Banner' })],
        displayTemplates: [],
        propertyGroups: [],
      });
      expectReported('To push', 'Banner (content type)', 'new');
    });

    test('treats a difference from the server as a conflict', async () => {
      await writeConfig([editedHero, banner]);
      server = await localManifest();
      await writeConfig();

      await expect(patch()).rejects.toThrow(ExitError);

      expectReported(
        'Conflicts — differs from the server, with no saved state to tell which side changed',
        'Hero (content type)',
      );
      expect(client.POST).not.toHaveBeenCalled();
    });
  });

  test('pushes only the item that changed locally', async () => {
    await baseline();
    await writeConfig([editedHero, banner]);

    await patch();

    expect(postedKeys()).toEqual(['Hero']);
    expectReported('To push', 'Hero (content type)', 'changed');
  });

  test('warns about a teammate change without pushing', async () => {
    await baseline();
    server = withServerContentType('Hero', {
      displayName: 'Hero (teammate)',
      lastModifiedBy: 'teammate@example.com',
      lastModified: '2026-11-23T10:00:00Z',
    });

    await patch();

    expect(client.POST).not.toHaveBeenCalled();
    expectReported(
      'Changed on the server — run config pull to see it',
      'Hero (content type)',
      'by teammate@example.com',
      '2026-11-23 10:00 UTC',
    );
  });

  test('reports an item removed from the config without deleting it', async () => {
    await baseline();
    await writeConfig([hero]);

    await patch();

    expect(client.POST).not.toHaveBeenCalled();
    expect(client.DELETE).not.toHaveBeenCalled();
    expectReported('Still in the CMS — removed from your config, not deleted', 'Banner (content type)');
  });

  describe('conflicts', () => {
    const editedBanner = contentTypeDefinition('Banner', {
      properties: { subtitle: { type: 'string', group: 'layout', maxLength: 40 } },
    });

    // Hero changed on both sides, Banner changed only locally
    const conflict = async () => {
      await baseline();
      server = withServerContentType('Hero', { displayName: 'Hero (teammate)' });
      await writeConfig([editedHero, editedBanner]);
    };

    test('abort without pushing anything outside a terminal, printing what differs', async () => {
      await conflict();

      await expect(patch()).rejects.toThrow(ExitError);

      const logs = printed(consoleSpies.log);
      expect(logs).toContain('Conflict details');
      expect(logs).toMatch(/displayName\s+local: "Hero"\s+server: "Hero \(teammate\)"/);
      expect(logs).toMatch(/properties\.title\.maxLength\s+local: 80\s+server: \(not set\)/);
      expect(client.POST).not.toHaveBeenCalled();
      expect(printed(consoleSpies.error)).toContain('--overwrite');
      expect(printed(consoleSpies.error)).toContain('--skipConflicts');
    });

    test('are pushed with --overwrite', async () => {
      await conflict();

      await patch('--overwrite');

      expect(postedKeys()).toEqual(['Hero', 'Banner']);
    });

    test('are left out with --skipConflicts, keeping their saved state', async () => {
      await conflict();
      const savedHero = async () => {
        const [instance] = Object.values(JSON.parse(await readState()).instances) as {
          items: Record<string, unknown>;
        }[];
        return instance.items['contentTypes:Hero'];
      };
      const heroBefore = await savedHero();

      await patch('--skipConflicts');

      expect(postedKeys()).toEqual(['Banner']);
      expect(await savedHero()).toEqual(heroBefore);
    });

    test('reject --overwrite together with --skipConflicts', async () => {
      await conflict();

      await expect(patch('--overwrite', '--skipConflicts')).rejects.toThrow();

      expect(client.POST).not.toHaveBeenCalled();
    });

    describe('in a terminal', () => {
      const streams = [process.stdin, process.stdout];
      const ttyDescriptors = streams.map(stream =>
        Object.getOwnPropertyDescriptor(stream, 'isTTY'),
      );

      beforeEach(() =>
        streams.forEach(stream =>
          Object.defineProperty(stream, 'isTTY', { value: true, configurable: true }),
        ),
      );

      afterEach(() =>
        streams.forEach((stream, index) => {
          const descriptor = ttyDescriptors[index];
          if (descriptor) Object.defineProperty(stream, 'isTTY', descriptor);
          else delete (stream as { isTTY?: boolean }).isTTY;
        }),
      );

      test.each([
        ['overwrite', ['Hero', 'Banner']],
        ['skip', ['Banner']],
      ] as const)('push what the prompt answer "%s" allows', async (answer, keys) => {
        await conflict();
        vi.mocked(select).mockResolvedValue(answer);

        await patch();

        expect(postedKeys()).toEqual(keys);
      });

      test('show the differences on request, then ask again without offering them', async () => {
        await conflict();
        vi.mocked(select).mockResolvedValueOnce('show').mockResolvedValueOnce('skip');

        await patch();

        const offered = vi
          .mocked(select)
          .mock.calls.map(([options]) => options.choices.map(choice => (choice as { value: string }).value));
        expect(offered).toEqual([
          ['show', 'overwrite', 'skip', 'abort'],
          ['overwrite', 'skip', 'abort'],
        ]);
        expect(printed(consoleSpies.log)).toContain('Conflict details');
        expect(postedKeys()).toEqual(['Banner']);
      });

      test('push nothing when the prompt is aborted', async () => {
        await conflict();
        vi.mocked(select).mockResolvedValue('abort');

        await expect(patch()).rejects.toThrow(ExitError);

        expect(client.POST).not.toHaveBeenCalled();
      });
    });
  });

  test('--dryRun reports without pushing, prompting or saving', async () => {
    await baseline();
    const stateBefore = await readState();
    await writeConfig([editedHero, banner]);

    await patch('--dryRun');

    expect(client.POST).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expectReported('To push', 'Hero (content type)', 'changed');
    expect(await readState()).toBe(stateBefore);
  });

  test('syncs locales only when they changed', async () => {
    await writeConfig([hero, banner], { locale: ['en'] });
    server = await localManifest();

    await patch();
    await patch();

    expect(client.GET.mock.calls.filter(([requestPath]) => requestPath === '/locales')).toHaveLength(1);
  });

  describe('applications and content', () => {
    const aboutContent = { key: 'about', displayName: 'About', contentType: 'Hero' };
    const blogContent = { key: 'blog', displayName: 'Blog', contentType: 'Hero' };
    const site = { key: 'site', displayName: 'Site', type: 'website', entryPoint: 'about' };
    const blogApp = { key: 'blog_app', displayName: 'Blog', type: 'website', entryPoint: 'blog' };

    // seeds the state as if `applications` and `content` had been synced before
    const seedSynced = async (applications: object[], content: string[]) =>
      savePatchState(configPath(), undefined, {
        local: {},
        server: {},
        record: [],
        applications: hashApplications(applications as { key: string }[]),
        content,
      });

    beforeEach(async () => {
      await writeConfig([hero, banner], {
        applications: [site, blogApp],
        content: [aboutContent, blogContent],
      });
      server = await localManifest();
    });

    test('sync a changed application with only the content it points at', async () => {
      await seedSynced([site, { ...blogApp, displayName: 'Old blog' }], ['about', 'blog']);

      await patch();

      expect(checkApplications).toHaveBeenCalledWith([blogApp], [blogContent], undefined);
      expect(processContentWithApplications).not.toHaveBeenCalled();
      expect(reportSection('Applications to sync — changed since the last push')).toEqual([
        'blog_app (Blog)',
      ]);
    });

    test('create only content added since the last sync, without touching applications', async () => {
      await seedSynced([site, blogApp], ['about']);

      await patch();

      expect(checkApplications).not.toHaveBeenCalled();
      expect(processContentWithApplications).toHaveBeenCalledWith([blogContent], [], undefined);
      expect(reportSection('Content to sync — added since the last push')).toEqual([
        'blog (Blog)',
      ]);
    });

    test('leave both alone when neither changed', async () => {
      await seedSynced([site, blogApp], ['about', 'blog']);

      await patch();

      expect(checkApplications).not.toHaveBeenCalled();
      expect(processContentWithApplications).not.toHaveBeenCalled();
    });
  });

  // seeds the state instead of rewriting the config: Node caches the imported config module
  test('lists only the locales added since the last sync', async () => {
    await writeConfig([hero, banner], { locale: ['en', 'sv'] });
    server = await localManifest();
    await savePatchState(configPath(), undefined, {
      local: {},
      server: {},
      record: [],
      locales: ['en'],
    });

    await patch();

    expect(reportSection('Locales to sync — added since the last push')).toEqual(['sv']);
  });
});
