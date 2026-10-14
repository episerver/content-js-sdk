import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import ConfigPush from '../commands/config/push.js';
import { createApiClient } from '../service/cmsRestClient.js';
import {
  ExitError,
  apiResponse,
  componentSource,
  contentTypeDefinition,
  mockApiClient,
  mockExit,
  printed,
  silenceConsole,
  writeProject,
  type MockApiClient,
} from './helpers.js';

vi.mock('../service/cmsRestClient.js');
vi.mock('ora', async () => ({
  default: vi.fn((await import('./helpers.js')).createSpinner),
}));

const hero = contentTypeDefinition('Hero', {
  properties: { title: { type: 'string', group: 'content' } },
});
const banner = contentTypeDefinition('Banner', {
  properties: { subtitle: { type: 'string', group: 'layout' } },
});
const unconstrained = (key: string) =>
  contentTypeDefinition(key, { properties: { body: { type: 'content' } } });

const site = {
  key: 'site',
  displayName: 'Site',
  type: 'website',
  entryPoint: 'cms://content/abc',
};

describe('config push', () => {
  let tempDir: string;
  let client: MockApiClient;
  let consoleSpies: ReturnType<typeof silenceConsole>;

  const push = (...args: string[]) => ConfigPush.run(args, import.meta.url);

  const writeConfig = (config: Record<string, unknown> = {}, components = [hero, banner]) =>
    writeProject(
      tempDir,
      {
        components: ['./components/*.ts'],
        propertyGroups: [{ key: 'content' }, { key: 'layout' }],
        ...config,
      },
      { 'components/Types.ts': componentSource(components) },
    );

  const postedBody = () => client.POST.mock.calls[0][1].body;

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await mkdtemp(join(tmpdir(), 'cli-push-'));
    client = mockApiClient();
    client.POST.mockResolvedValue(apiResponse({ data: { outcomes: [] } }));
    vi.mocked(createApiClient).mockResolvedValue(client as never);
    consoleSpies = silenceConsole();
    mockExit();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
    await rm(tempDir, { recursive: true, force: true });
  });

  test.each(['', ' , '])('rejects an --only value without keys (%j)', async only => {
    await expect(push('--only', only)).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain('--only requires at least one key');
    expect(createApiClient).not.toHaveBeenCalled();
  });

  test('exits when the config file does not exist', async () => {
    const missing = join(tempDir, 'missing.config.mjs');

    await expect(push(missing)).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain(`Configuration file not found: ${missing}`);
  });

  test.each([
    ['missing', {}],
    ['not an array', { components: './components/*.ts' }],
  ])('exits when components is %s', async (_, config) => {
    const configPath = await writeProject(tempDir, config);

    await expect(push(configPath)).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain(
      'Invalid configuration: "components" field must be an array',
    );
  });

  test('reports a single content area constraint issue and pushes nothing', async () => {
    const configPath = await writeConfig({}, [unconstrained('Page')]);

    await expect(push(configPath)).rejects.toThrow(ExitError);

    const errors = printed(consoleSpies.error);
    expect(errors).toContain('Invalid content type configuration (1 issue found):');
    expect(errors).toContain('Content type "Page", property "body" (content): missing type constraints.');
    expect(errors).toContain('Nothing was pushed to the CMS.');
    expect(createApiClient).not.toHaveBeenCalled();
  });

  test('uses plural wording for several constraint issues', async () => {
    const configPath = await writeConfig({}, [unconstrained('Page'), unconstrained('Article')]);

    await expect(push(configPath)).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain(
      'Invalid content type configuration (2 issues found):',
    );
  });

  test('requires content when an application has no entryPoint', async () => {
    const configPath = await writeConfig({ applications: [{ ...site, entryPoint: undefined }] });

    await expect(push(configPath)).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain(
      'Content configuration required when applications defined without entryPoint',
    );
    expect(createApiClient).not.toHaveBeenCalled();
  });

  test('exits on --only keys that match nothing in the config', async () => {
    const configPath = await writeConfig();

    await expect(push(configPath, '--only', 'Hero,Nope,Missing')).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain('Unknown keys in --only: Nope, Missing');
    expect(createApiClient).not.toHaveBeenCalled();
  });

  test('uploads the full manifest built from the config', async () => {
    const configPath = await writeConfig();

    await push(configPath, '--host', 'https://cms.example.com');

    expect(createApiClient).toHaveBeenCalledWith('https://cms.example.com');
    expect(client.POST).toHaveBeenCalledWith(
      '/manifest',
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          'content-type': 'application/vnd.optimizely.cms.v1.manifest+json',
        },
      }),
    );
    expect(postedBody()).toEqual({
      contentTypes: [
        expect.objectContaining({ key: 'Hero', properties: hero.properties }),
        expect.objectContaining({ key: 'Banner', properties: banner.properties }),
      ],
      displayTemplates: [],
      propertyGroups: [
        { key: 'content', displayName: 'Content', sortOrder: 1 },
        { key: 'layout', displayName: 'Layout', sortOrder: 2 },
      ],
    });
    expect(printed(consoleSpies.log)).toContain('Property Groups found: [Content, Layout]');
  });

  test('syncs locales and checks applications on a full push', async () => {
    const configPath = await writeConfig({ locale: ['en'], applications: [site] });
    client.GET.mockResolvedValue(apiResponse({ data: { items: [{ key: 'en', isEnabled: true }] } }));

    await push(configPath);

    expect(client.GET).toHaveBeenCalledWith('/locales');
    expect(client.GET).toHaveBeenCalledWith('/applications/{key}', expect.anything());
  });

  test('pushes only the selected keys and leaves locales and applications alone', async () => {
    const configPath = await writeConfig({ locale: ['en'], applications: [site] });

    await push(configPath, '--only', 'Hero');

    expect(postedBody()).toEqual({
      contentTypes: [expect.objectContaining({ key: 'Hero' })],
      displayTemplates: [],
      propertyGroups: [{ key: 'content', displayName: 'Content', sortOrder: 1 }],
    });
    expect(printed(consoleSpies.log)).toContain('Pushing content types: [Hero]');
    expect(printed(consoleSpies.log)).not.toContain('Applications found');
    expect(client.GET).not.toHaveBeenCalled();
    expect(createApiClient).toHaveBeenCalledTimes(1);
  });

  test('writes the manifest to --output', async () => {
    const configPath = await writeConfig();
    const outputPath = join(tempDir, 'manifest.json');

    await push(configPath, '--output', outputPath, '--dryRun');

    const written = JSON.parse(await readFile(outputPath, 'utf-8'));
    expect(written.contentTypes.map((it: { key: string }) => it.key)).toEqual(['Hero', 'Banner']);
    expect(printed(consoleSpies.info)).toContain(`Configuration file written to '${outputPath}'`);
  });

  test('exits when --output cannot be written', async () => {
    const configPath = await writeConfig();
    const outputPath = join(tempDir, 'missing-dir', 'manifest.json');

    await expect(push(configPath, '--output', outputPath)).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain(`Failed to write output file: ${outputPath}`);
    expect(client.POST).not.toHaveBeenCalled();
  });

  test('sends nothing with --dryRun', async () => {
    const configPath = await writeConfig();

    await push(configPath, '--dryRun');

    expect(client.POST).not.toHaveBeenCalled();
  });

  test('asks the CMS to ignore data loss warnings with --force', async () => {
    const configPath = await writeConfig();

    await push(configPath, '--force');

    expect(client.POST.mock.calls[0][1].params).toEqual({
      header: { 'cms-ignore-data-loss-warnings': true },
    });
    expect(printed(consoleSpies.warn)).toContain('--force is used!');
  });

  test('prints every field error of a rejected upload', async () => {
    const configPath = await writeConfig();
    client.POST.mockResolvedValue(
      apiResponse({
        error: {
          status: 400,
          title: 'Invalid manifest',
          code: 'ValidationError',
          detail: 'See errors',
          errors: [{ detail: 'Key is reserved', field: 'contentTypes[0].key' }],
        },
      }),
    );

    await expect(push(configPath)).rejects.toThrow(ExitError);

    const errors = printed(consoleSpies.error);
    expect(errors).toContain('Error 400: Invalid manifest (ValidationError)');
    expect(errors).toContain('See errors');
    expect(errors).toContain('- ERROR 1');
    expect(errors).toContain('[DETAIL] Key is reserved');
    expect(errors).toContain('[FIELD]  contentTypes[0].key');
  });

  test('falls back to placeholders for a rejected upload without details', async () => {
    const configPath = await writeConfig();
    client.POST.mockResolvedValue(apiResponse({ status: 500, error: { status: 500 } }));

    await expect(push(configPath)).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain('Error 500: Unknown error (N/A)');
    expect(printed(consoleSpies.error)).not.toContain('ERROR 1');
  });

  test('exits when the CMS responds without content', async () => {
    const configPath = await writeConfig();
    client.POST.mockResolvedValue(apiResponse());

    await expect(push(configPath)).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain('The server did not respond with any content');
  });

  test('prints outcomes and exits on translated import errors', async () => {
    const configPath = await writeConfig();
    client.POST.mockResolvedValue(
      apiResponse({
        data: {
          outcomes: [{ message: 'Hero updated' }],
          errors: [
            {
              section: 'contentTypes',
              message:
                "Removing a property loses data. Use the 'ignoreDataLossWarnings' option to apply the changes anyway.",
            },
          ],
        },
      }),
    );

    await expect(push(configPath)).rejects.toThrow(ExitError);

    const logs = printed(consoleSpies.log);
    expect(logs).toContain('Hero updated');
    expect(logs).toContain(
      "Removing a property loses data. Use the '--force' flag to apply the changes anyway.",
    );
  });
});
