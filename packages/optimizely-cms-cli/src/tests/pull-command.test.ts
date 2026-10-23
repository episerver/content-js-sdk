import { describe, it, test, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import ora from 'ora';
import { confirm, input, select } from '@inquirer/prompts';
import ConfigPull from '../commands/config/pull.js';
import { createApiClient } from '../service/cmsRestClient.js';
import {
  apiResponse,
  manifestContentType,
  mockApiClient,
  printed,
  silenceConsole,
  spinnerMessages,
  type MockApiClient,
} from './helpers.js';

vi.mock('../service/cmsRestClient.js');
vi.mock('@inquirer/prompts');
vi.mock('ora', async () => ({
  default: vi.fn((await import('./helpers.js')).createSpinner),
}));

const cmsManifest = () => ({
  contentTypes: [
    manifestContentType('ArticlePage', { baseType: '_page' }),
    manifestContentType('Hero'),
    manifestContentType('BlankExperience', { baseType: '_experience' }),
    manifestContentType('BlankSection', { baseType: '_section' }),
  ],
  displayTemplates: [
    { key: 'HeroWide', displayName: 'Hero Wide', isDefault: false, contentType: 'Hero' },
  ],
  propertyGroups: [{ key: 'seo', displayName: 'SEO' }],
});

const listFiles = async (dir: string): Promise<string[]> =>
  (await readdir(dir, { recursive: true, withFileTypes: true }))
    .filter(it => it.isFile())
    .map(it => join(it.parentPath, it.name).slice(dir.length + 1).replaceAll('\\', '/'))
    .sort();

describe('config pull flags', () => {
  it('assigns each short flag to exactly one flag', () => {
    const chars = Object.values(ConfigPull.flags)
      .map(f => (f as { char?: string }).char)
      .filter((c): c is string => Boolean(c));

    expect(chars).toEqual([...new Set(chars)]);
  });
});

describe('config pull', () => {
  const ttyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');

  let tempDir: string;
  let client: MockApiClient;
  let commandLog: MockInstance;
  let commandWarn: MockInstance;

  const pull = (...args: string[]) => ConfigPull.run(args, import.meta.url);
  const setTTY = (value: boolean) =>
    Object.defineProperty(process.stdout, 'isTTY', { value, configurable: true });
  const requestedQuery = () => client.GET.mock.calls[0][1].params.query;

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await mkdtemp(join(tmpdir(), 'cli-pull-'));
    client = mockApiClient();
    client.GET.mockResolvedValue(apiResponse({ data: cmsManifest() }));
    vi.mocked(createApiClient).mockResolvedValue(client as never);
    vi.mocked(confirm).mockResolvedValue(false);
    silenceConsole();
    commandLog = vi.spyOn(ConfigPull.prototype, 'log').mockImplementation(() => {});
    commandWarn = vi.spyOn(ConfigPull.prototype, 'warn').mockImplementation(input => input);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
    if (ttyDescriptor) Object.defineProperty(process.stdout, 'isTTY', ttyDescriptor);
    else delete (process.stdout as { isTTY?: boolean }).isTTY;
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('without a TTY', () => {
    beforeEach(() => setTTY(false));

    test('prints the unfiltered manifest as JSON when no output flag is given', async () => {
      await pull('--host', 'https://cms.example.com');

      expect(createApiClient).toHaveBeenCalledWith('https://cms.example.com');
      expect(requestedQuery()).toEqual({
        sections: ['contentTypes', 'displayTemplates', 'propertyGroups'],
      });
      expect(commandLog).toHaveBeenCalledWith(JSON.stringify(cmsManifest(), null, 2));
      expect(spinnerMessages(ora, 'succeed')).toEqual([
        ' Downloaded configuration from CMS (4 content types, 1 property group, 1 display template)',
      ]);
      expect(confirm).not.toHaveBeenCalled();
    });

    test('writes grouped files without prompting when only --output is given', async () => {
      await pull('--output', tempDir);

      expect(await listFiles(tempDir)).toEqual([
        'component/HeroCT.ts',
        'displayTemplates/HeroWideDT.ts',
        'page/ArticlePageCT.ts',
      ]);
      expect(input).not.toHaveBeenCalled();
      expect(select).not.toHaveBeenCalled();
      expect(confirm).not.toHaveBeenCalled();
    });

    test('writes into the default output directory when only a layout flag is given', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue(tempDir);

      await pull('--single-file');

      expect(await listFiles(tempDir)).toEqual(['src/content-types/manifest.ts']);
      expect(input).not.toHaveBeenCalled();
    });

    test('requests read-only content types with --include-read-only', async () => {
      await pull('--include-read-only');

      expect(requestedQuery()).toMatchObject({ includeReadOnly: true });
    });

    test('combines status, title and detail in the error message', async () => {
      client.GET.mockResolvedValue(
        apiResponse({
          status: 500,
          error: { status: 500, title: 'Server Error', detail: 'Database down' },
        }),
      );
      const message = 'Failed to fetch manifest from CMS (status 500): Server Error - Database down';

      await expect(pull()).rejects.toThrow(message);

      expect(spinnerMessages(ora, 'fail')).toEqual([message]);
      expect(process.exitCode).toBe(1);
    });

    test('falls back to the response status when the error has no body', async () => {
      client.GET.mockResolvedValue(apiResponse({ status: 503, statusText: 'Service Unavailable' }));

      await expect(pull()).rejects.toThrow(
        'Failed to fetch manifest from CMS (status 503): Service Unavailable',
      );
    });

    test('fails softly when the CMS responds without content', async () => {
      client.GET.mockResolvedValue(apiResponse());

      await expect(pull()).resolves.toBeUndefined();

      expect(spinnerMessages(ora, 'fail')).toEqual(['The server did not respond with any content']);
      expect(process.exitCode).toBe(1);
      expect(commandLog).not.toHaveBeenCalled();
    });
  });

  describe('in a TTY', () => {
    beforeEach(() => setTTY(true));

    test('prints JSON with --json', async () => {
      await pull('--json');

      expect(commandLog).toHaveBeenCalledWith(JSON.stringify(cmsManifest(), null, 2));
      expect(confirm).not.toHaveBeenCalled();
    });

    test('rejects --json combined with --output', async () => {
      await expect(pull('--json', '--output', tempDir)).rejects.toThrow(
        '--output=' + tempDir + ' cannot also be provided when using --json',
      );
      expect(createApiClient).not.toHaveBeenCalled();
    });

    test('writes grouped files without the built-in types', async () => {
      await pull('--output', tempDir, '--group');

      expect(await listFiles(tempDir)).toEqual([
        'component/HeroCT.ts',
        'displayTemplates/HeroWideDT.ts',
        'page/ArticlePageCT.ts',
      ]);
      expect(input).not.toHaveBeenCalled();
      expect(select).not.toHaveBeenCalled();
      expect(spinnerMessages(ora, 'succeed')).toContain(` Generated 3 file(s) in ${tempDir}`);
    });

    test('writes one file per type with --individual', async () => {
      await pull('--output', tempDir, '--individual');

      expect(await listFiles(tempDir)).toEqual(['ArticlePageCT.ts', 'HeroCT.ts', 'HeroWideDT.ts']);
    });

    test('writes manifest.ts into the output directory with --single-file', async () => {
      await pull('--output', tempDir, '--single-file');

      expect(await listFiles(tempDir)).toEqual(['manifest.ts']);
      expect(await readFile(join(tempDir, 'manifest.ts'), 'utf-8')).toContain(
        'export const ArticlePageCT = contentType(',
      );
    });

    test('writes a single file and warns when --output ends with .ts and --group is set', async () => {
      await pull('--output', join(tempDir, 'cms', 'types.ts'), '--group');

      expect(await listFiles(tempDir)).toEqual(['cms/types.ts']);
      expect(commandWarn).toHaveBeenCalledWith(
        'Flags --group and --individual are ignored when --output ends with .ts(x) (single-file mode)',
      );
    });

    test('asks for the output location and layout when no flag is given', async () => {
      vi.mocked(input).mockResolvedValue(tempDir);
      vi.mocked(select).mockResolvedValue('individual');

      await pull();

      expect(await listFiles(tempDir)).toEqual(['ArticlePageCT.ts', 'HeroCT.ts', 'HeroWideDT.ts']);
    });

    test('writes registry.ts at the output root when requested', async () => {
      vi.mocked(confirm).mockResolvedValueOnce(true).mockResolvedValueOnce(true);

      await pull('--output', tempDir, '--group');

      const registry = await readFile(join(tempDir, 'registry.ts'), 'utf-8');
      expect(registry).toContain(`import { HeroCT } from './component/HeroCT';`);
      expect(registry).toContain('config({');
    });

    test('warns about read-only types and requests them with --include-read-only', async () => {
      await pull('--output', tempDir, '--group', '--include-read-only');

      expect(printed(commandLog)).toContain('Pulling all content types including read-only ones');
      expect(requestedQuery()).toMatchObject({ includeReadOnly: true });
    });

    test('stops on a manifest without a contentTypes array', async () => {
      client.GET.mockResolvedValue(apiResponse({ data: { displayTemplates: [] } }));

      await pull('--output', tempDir, '--group');

      expect(spinnerMessages(ora, 'fail')).toEqual(['Invalid manifest: contentTypes array not found']);
      expect(process.exitCode).toBe(1);
      expect(await listFiles(tempDir)).toEqual([]);
    });
  });
});
