import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readPatchState, savePatchState } from '../service/patchState.js';
import { printed, silenceConsole } from './helpers.js';

const HOST = 'https://api.cms.optimizely.com';

describe('patch state', () => {
  let tempDir: string;
  let configFilePath: string;
  let stateFile: string;
  let consoleSpies: ReturnType<typeof silenceConsole>;

  const readStateFile = async () => JSON.parse(await readFile(stateFile, 'utf8'));
  const update = (overrides = {}) => ({
    local: { 'contentTypes:Tile': 'L1', 'contentTypes:Hero': 'H1' },
    server: { 'contentTypes:Tile': 'S1', 'contentTypes:Hero': 'HS1' },
    record: ['contentTypes:Tile', 'contentTypes:Hero'],
    ...overrides,
  });

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cli-patch-state-'));
    configFilePath = join(tempDir, 'optimizely.config.mjs');
    stateFile = join(tempDir, '.optimizely', 'patch-state.json');
    vi.stubEnv('OPTIMIZELY_CMS_CLIENT_ID', 'client-a');
    vi.stubEnv('OPTIMIZELY_CMS_CLIENT_SECRET', 'secret');
    vi.stubEnv('OPTIMIZELY_CMS_API_URL', '');
    consoleSpies = silenceConsole();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('readPatchState', () => {
    test('is empty when no state file exists', async () => {
      expect(await readPatchState(configFilePath)).toEqual({ items: {} });
      expect(consoleSpies.warn).not.toHaveBeenCalled();
    });

    test.each([
      ['invalid JSON', '{ not json'],
      ['an unknown version', JSON.stringify({ version: 2, instances: {} })],
    ])('warns and is empty for %s', async (_, content) => {
      await mkdir(join(tempDir, '.optimizely'));
      await writeFile(stateFile, content);

      expect(await readPatchState(configFilePath)).toEqual({ items: {} });
      expect(printed(consoleSpies.warn)).toContain('Ignoring unreadable patch state');
    });
  });

  describe('savePatchState', () => {
    test('writes .optimizely/patch-state.json next to the config, keyed by host and client ID', async () => {
      await savePatchState(configFilePath, undefined, update({ applications: 'A1' }));

      expect(await readStateFile()).toEqual({
        version: 1,
        instances: {
          [`${HOST}|client-a`]: {
            updatedAt: expect.any(String),
            items: {
              'contentTypes:Hero': { local: 'H1', server: 'HS1' },
              'contentTypes:Tile': { local: 'L1', server: 'S1' },
            },
            applications: 'A1',
          },
        },
      });
    });

    test('reads back what it saved', async () => {
      await savePatchState(configFilePath, undefined, update({ locales: 'LOC' }));

      expect(await readPatchState(configFilePath)).toMatchObject({
        items: { 'contentTypes:Tile': { local: 'L1', server: 'S1' } },
        locales: 'LOC',
      });
    });

    test('keeps instances apart by host and by client ID', async () => {
      await savePatchState(configFilePath, undefined, update());
      await savePatchState(configFilePath, 'https://other.example.com', update({ record: [] }));
      vi.stubEnv('OPTIMIZELY_CMS_CLIENT_ID', 'client-b');

      expect(await readPatchState(configFilePath)).toEqual({ items: {} });
      expect(Object.keys((await readStateFile()).instances)).toEqual([
        `${HOST}|client-a`,
        'https://other.example.com|client-a',
      ]);
    });

    test('updates recorded items, drops forgotten ones and keeps the rest', async () => {
      await savePatchState(configFilePath, undefined, update({ applications: 'A1', locales: 'LOC' }));
      await savePatchState(configFilePath, undefined, {
        local: { 'contentTypes:Tile': 'L2', 'propertyGroups:seo': 'G1' },
        server: { 'contentTypes:Tile': 'S2' },
        record: ['contentTypes:Tile', 'propertyGroups:seo'],
        drop: ['contentTypes:Hero'],
        applications: 'A2',
      });

      expect(await readPatchState(configFilePath)).toEqual({
        updatedAt: expect.any(String),
        // seo has no server hash yet, so it is not recorded
        items: { 'contentTypes:Tile': { local: 'L2', server: 'S2' } },
        applications: 'A2',
        locales: 'LOC',
      });
    });

    test('replaces an unreadable state file', async () => {
      await mkdir(join(tempDir, '.optimizely'));
      await writeFile(stateFile, '{ not json');

      await savePatchState(configFilePath, undefined, update());

      expect((await readStateFile()).version).toBe(1);
    });
  });
});
