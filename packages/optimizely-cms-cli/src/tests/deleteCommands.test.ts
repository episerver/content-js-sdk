import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import ora from 'ora';
import { confirm } from '@inquirer/prompts';
import ConfigDelete from '../commands/config/delete.js';
import DangerDeleteAllContentTypes from '../commands/danger/delete-all-content-types.js';
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
  spinnerMessages,
  writeProject,
  type MockApiClient,
} from './helpers.js';

vi.mock('../service/cmsRestClient.js');
vi.mock('@inquirer/prompts');
vi.mock('ora', async () => ({
  default: vi.fn((await import('./helpers.js')).createSpinner),
}));

const cmsTypes = (...items: { key: string; source?: string }[]) =>
  apiResponse({ data: { items: items.map(it => ({ displayName: `${it.key} Name`, ...it })) } });

const dependencyConflict = apiResponse({
  status: 409,
  error: { title: 'Conflict', code: 'DependencyConflict', detail: 'Has content' },
});
const otherFailure = apiResponse({
  status: 400,
  error: { title: 'Bad Request', detail: 'Type is locked' },
});

let client: MockApiClient;
let consoleSpies: ReturnType<typeof silenceConsole>;

beforeEach(() => {
  vi.clearAllMocks();
  client = mockApiClient();
  vi.mocked(createApiClient).mockResolvedValue(client as never);
  vi.mocked(confirm).mockResolvedValue(true);
  consoleSpies = silenceConsole();
  mockExit();
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe('config delete', () => {
  let tempDir: string;

  const remove = (...args: string[]) => ConfigDelete.run(args, import.meta.url);
  const writeConfig = (keys = ['Hero', 'Banner']) =>
    writeProject(
      tempDir,
      { components: ['./components/*.ts'] },
      { 'components/Types.ts': componentSource(keys.map(key => contentTypeDefinition(key))) },
    );

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cli-delete-'));
  });

  afterEach(() => rm(tempDir, { recursive: true, force: true }));

  test('exits when the config file does not exist', async () => {
    await expect(remove(join(tempDir, 'missing.mjs'))).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain('Configuration file not found');
  });

  test('exits when components is not an array', async () => {
    const configPath = await writeProject(tempDir, { components: 'nope' });

    await expect(remove(configPath)).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain('"components" field must be an array');
  });

  test('stops before connecting when the project defines no content types', async () => {
    const configPath = await writeConfig([]);

    await remove(configPath);

    expect(printed(consoleSpies.log)).toContain('No content types defined in project configuration');
    expect(createApiClient).not.toHaveBeenCalled();
  });

  test('reports a connection failure', async () => {
    const configPath = await writeConfig();
    vi.mocked(createApiClient).mockRejectedValue(new Error('Invalid credentials'));

    await expect(remove(configPath)).rejects.toThrow('Invalid credentials');

    expect(spinnerMessages(ora, 'fail')).toEqual(['Failed to connect to CMS']);
  });

  test('reports a failed content type request', async () => {
    const configPath = await writeConfig();
    client.GET.mockRejectedValue(new Error('Network down'));

    await expect(remove(configPath)).rejects.toThrow('Network down');

    expect(spinnerMessages(ora, 'fail')).toEqual(['Failed to fetch content types']);
  });

  test('exits when the CMS returns no content type list', async () => {
    const configPath = await writeConfig();
    client.GET.mockResolvedValue(apiResponse({ status: 500, error: { title: 'Server Error' } }));

    await expect(remove(configPath)).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain('Failed to fetch content types from the CMS');
  });

  test('lists project types missing from the CMS and deletes nothing when none match', async () => {
    const configPath = await writeConfig();
    client.GET.mockResolvedValue(cmsTypes({ key: 'Hero', source: 'system' }, { key: 'Other' }));

    await remove(configPath);

    const logs = printed(consoleSpies.log);
    expect(logs).toContain('No project-defined content types found in the CMS');
    expect(logs).toContain('- Hero');
    expect(logs).toContain('- Banner');
    expect(confirm).not.toHaveBeenCalled();
  });

  test('deletes nothing when the confirmation is declined', async () => {
    const configPath = await writeConfig();
    client.GET.mockResolvedValue(cmsTypes({ key: 'Hero' }));
    vi.mocked(confirm).mockResolvedValue(false);

    await remove(configPath);

    expect(printed(consoleSpies.log)).toContain('Operation cancelled.');
    expect(client.DELETE).not.toHaveBeenCalled();
  });

  test('deletes only project types without a source and summarises the result', async () => {
    const configPath = await writeConfig(['Hero', 'Banner', 'Card', 'Missing']);
    client.GET.mockResolvedValue(
      cmsTypes({ key: 'Hero' }, { key: 'Banner' }, { key: 'Card' }, { key: 'Other' }, {
        key: 'System',
        source: 'system',
      }),
    );
    client.DELETE.mockImplementation(async (_, { params }) =>
      params.path.key === 'Banner' ? dependencyConflict
      : params.path.key === 'Card' ? otherFailure
      : apiResponse({ status: 204 }),
    );

    await remove(configPath, '--host', 'https://cms.example.com');

    expect(createApiClient).toHaveBeenCalledWith('https://cms.example.com');
    expect(client.DELETE.mock.calls.map(([, options]) => options.params.path.key)).toEqual([
      'Hero',
      'Banner',
      'Card',
    ]);
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Delete 3 content types?') }),
    );
    expect(printed(consoleSpies.log)).toContain('Note: The following project types are not in the CMS:');
    expect(spinnerMessages(ora, 'succeed')).toEqual(["'Hero' deleted"]);
    expect(spinnerMessages(ora, 'fail')).toEqual([
      "'Banner' cannot be deleted",
      "'Card' cannot be deleted",
    ]);

    const errors = printed(consoleSpies.error);
    expect(errors).toContain('content instances of this type exist');
    expect(errors).not.toContain('Details: Has content');
    expect(errors).toContain('Details: Type is locked');

    const logs = printed(consoleSpies.log);
    expect(logs).toContain('Successfully deleted: 1');
    expect(logs).toContain('Failed to delete: 2');
  });
});

describe('danger delete-all-content-types', () => {
  const removeAll = (...args: string[]) => DangerDeleteAllContentTypes.run(args, import.meta.url);

  test('reports a connection failure', async () => {
    vi.mocked(createApiClient).mockRejectedValue(new Error('Invalid credentials'));

    await expect(removeAll()).rejects.toThrow('Invalid credentials');

    expect(spinnerMessages(ora, 'fail')).toEqual(['Failed to connect to CMS']);
  });

  test('reports a failed content type request', async () => {
    client.GET.mockRejectedValue(new Error('Network down'));

    await expect(removeAll()).rejects.toThrow('Network down');

    expect(spinnerMessages(ora, 'fail')).toEqual(['Failed to fetch content types']);
  });

  test('exits when the CMS returns no content type list', async () => {
    await expect(removeAll()).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain('Failed to fetch content types from the CMS');
  });

  test('stops when only system types exist', async () => {
    client.GET.mockResolvedValue(cmsTypes({ key: 'System', source: 'system' }));

    await removeAll();

    expect(printed(consoleSpies.log)).toContain('There are no user-defined content types in the CMS');
    expect(confirm).not.toHaveBeenCalled();
  });

  test.each([
    ['first', [false]],
    ['second', [true, false]],
  ])('deletes nothing when the %s confirmation is declined', async (_, answers) => {
    client.GET.mockResolvedValue(cmsTypes({ key: 'Hero' }));
    answers.forEach(answer => vi.mocked(confirm).mockResolvedValueOnce(answer));

    await removeAll();

    expect(confirm).toHaveBeenCalledTimes(answers.length);
    expect(printed(consoleSpies.log)).toContain('Operation cancelled.');
    expect(client.DELETE).not.toHaveBeenCalled();
  });

  test('deletes every user-defined type and summarises the result', async () => {
    client.GET.mockResolvedValue(
      cmsTypes({ key: 'Hero' }, { key: 'Banner' }, { key: 'Card' }, { key: 'System', source: 'cms' }),
    );
    client.DELETE.mockImplementation(async (_, { params }) =>
      params.path.key === 'Banner' ? dependencyConflict
      : params.path.key === 'Card' ? otherFailure
      : apiResponse({ status: 204 }),
    );

    await removeAll();

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('ALL 3 user-defined content types') }),
    );
    expect(client.DELETE.mock.calls.map(([, options]) => options.params.path.key)).toEqual([
      'Hero',
      'Banner',
      'Card',
    ]);
    expect(printed(consoleSpies.log)).toContain('Hero Name (Hero)');

    const errors = printed(consoleSpies.error);
    expect(errors).toContain('Error: Conflict');
    expect(errors).toContain('content instances of this type exist');
    expect(errors).toContain('Details: Type is locked');

    const logs = printed(consoleSpies.log);
    expect(logs).toContain('Successfully deleted: 1');
    expect(logs).toContain('Failed to delete: 2');
  });

  test('omits the failure line when every deletion succeeds', async () => {
    client.GET.mockResolvedValue(cmsTypes({ key: 'Hero' }));
    client.DELETE.mockResolvedValue(apiResponse({ status: 204 }));

    await removeAll();

    expect(printed(consoleSpies.log)).toContain('Successfully deleted: 1');
    expect(printed(consoleSpies.log)).not.toContain('Failed to delete');
  });
});
