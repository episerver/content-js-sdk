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

  test('deletes the content type', async () => {
    client.DELETE.mockResolvedValue(apiResponse({ status: 204 }));

    await remove('Article', '--host', 'https://cms.example.com');

    expect(createApiClient).toHaveBeenCalledWith('https://cms.example.com');
    expect(client.DELETE).toHaveBeenCalledWith('/contenttypes/{key}', {
      params: { path: { key: 'Article' } },
    });
    expect(spinnerMessages(ora, 'succeed')).toEqual(['Content type "Article" deleted successfully']);
  });

  test.each([
    ['404', { status: 404, title: 'Not Found' }, 'Content type "Article" not found'],
    ['409', { status: 409, title: 'Conflict' }, 'Cannot delete: Content type is in use'],
    ['other', { status: 400, title: 'Bad Request', detail: 'Locked' }, 'Error 400: Bad Request'],
  ])('explains a %s failure and exits', async (_, error, message) => {
    client.DELETE.mockResolvedValue(apiResponse({ status: error.status, error }));

    await expect(remove('Article')).rejects.toThrow(ExitError);

    expect(spinnerMessages(ora, 'fail')[0]).toBe('Failed to delete content type "Article"');
    expect(printed(consoleSpies.error)).toContain(message);
  });

  test('prints the detail of an unexpected error status', async () => {
    client.DELETE.mockResolvedValue(
      apiResponse({ status: 400, error: { status: 400, detail: 'Locked by an editor' } }),
    );

    await expect(remove('Article')).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain('Error 400: Unknown error');
    expect(printed(consoleSpies.error)).toContain('Locked by an editor');
  });

  test('reports an unexpected error when the failure has no body', async () => {
    client.DELETE.mockResolvedValue(apiResponse({ status: 500 }));

    await expect(remove('Article')).rejects.toThrow(ExitError);

    expect(printed(consoleSpies.error)).toContain('An unexpected error occurred');
  });

  test('reports a connection failure', async () => {
    vi.mocked(createApiClient).mockRejectedValue(new Error('Invalid credentials'));

    await expect(remove('Article')).rejects.toThrow('Invalid credentials');

    expect(spinnerMessages(ora, 'fail')).toEqual(['Failed to delete content type']);
    expect(printed(consoleSpies.error)).toContain('Invalid credentials');
  });
});
