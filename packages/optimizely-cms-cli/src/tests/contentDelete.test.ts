import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ora from 'ora';
import { confirm } from '@inquirer/prompts';
import ContentDelete from '../commands/content/delete.js';
import { createApiClient } from '../service/cmsRestClient.js';
import {
  ExitError,
  apiResponse,
  mockApiClient,
  mockExit,
  printed,
  respondByPath,
  silenceConsole,
  spinnerMessages,
  type MockApiClient,
} from './helpers.js';

vi.mock('../service/cmsRestClient.js');
vi.mock('@inquirer/prompts');
vi.mock('ora', async () => ({
  default: vi.fn((await import('./helpers.js')).createSpinner),
}));

describe('content delete', () => {
  let client: MockApiClient;
  let consoleSpies: ReturnType<typeof silenceConsole>;

  const remove = (...args: string[]) => ContentDelete.run(args, import.meta.url);
  const deletedKeys = () =>
    client.DELETE.mock.calls.map(([, options]) => options.params.path.key);

  beforeEach(() => {
    vi.clearAllMocks();
    client = mockApiClient();
    client.DELETE.mockResolvedValue(apiResponse({ status: 204 }));
    vi.mocked(createApiClient).mockResolvedValue(client as never);
    vi.mocked(confirm).mockResolvedValue(true);
    consoleSpies = silenceConsole();
    mockExit();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  test('requires a content type key', async () => {
    await expect(remove()).rejects.toThrow('Missing 1 required arg');
    expect(confirm).not.toHaveBeenCalled();
  });

  test('does nothing when the confirmation is declined', async () => {
    vi.mocked(confirm).mockResolvedValue(false);

    await remove('Article');

    expect(printed(consoleSpies.log)).toContain('Deletion cancelled.');
    expect(createApiClient).not.toHaveBeenCalled();
  });

  test('deletes one content type', async () => {
    await remove('Article', '--host', 'https://cms.example.com');

    expect(createApiClient).toHaveBeenCalledWith('https://cms.example.com');
    expect(client.DELETE).toHaveBeenCalledWith('/contenttypes/{key}', {
      params: { path: { key: 'Article' } },
    });
    expect(spinnerMessages(ora, 'succeed')).toEqual(['Deleted Article (content type)']);
  });

  test('deletes several content types after one confirmation, ignoring repeated keys', async () => {
    await remove('Article', 'ProductPage', 'Article');

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(vi.mocked(confirm).mock.calls[0][0].message).toContain('2 content types');
    expect(deletedKeys()).toEqual(['Article', 'ProductPage']);
  });

  test.each([
    [
      '404',
      { status: 404, title: 'Not Found' },
      'warn',
      'Article (content type) is not in the CMS',
    ],
    [
      '409',
      { status: 409, title: 'Conflict' },
      'fail',
      'Could not delete Article (content type): it is in use',
    ],
    [
      'other',
      { status: 400, title: 'Bad Request', detail: 'Locked' },
      'fail',
      'Could not delete Article (content type): error 400: Bad Request (Locked)',
    ],
  ] as const)('explains a %s response and exits', async (_, error, method, message) => {
    client.DELETE.mockResolvedValue(apiResponse({ status: error.status, error }));

    await expect(remove('Article')).rejects.toThrow(ExitError);

    expect(spinnerMessages(ora, method)).toEqual([message]);
  });

  test('reports an unexpected error when the failure has no body', async () => {
    client.DELETE.mockResolvedValue(apiResponse({ status: 500 }));

    await expect(remove('Article')).rejects.toThrow(ExitError);

    expect(spinnerMessages(ora, 'fail')).toEqual([
      'Could not delete Article (content type): an unexpected error occurred',
    ]);
  });

  test('deletes the remaining keys when one fails, then exits', async () => {
    respondByPath(client.DELETE, {}, apiResponse({ status: 204 }));
    client.DELETE.mockResolvedValueOnce(
      apiResponse({ status: 409, error: { status: 409 } }),
    );

    await expect(remove('Article', 'ProductPage')).rejects.toThrow(ExitError);

    expect(deletedKeys()).toEqual(['Article', 'ProductPage']);
    expect(spinnerMessages(ora, 'succeed')).toEqual([
      'Deleted ProductPage (content type)',
    ]);
  });

  test('reports a connection failure', async () => {
    vi.mocked(createApiClient).mockRejectedValue(new Error('Invalid credentials'));

    await expect(remove('Article')).rejects.toThrow('Invalid credentials');
  });
});
