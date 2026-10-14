import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ora from 'ora';
import { syncLocales } from '../service/localeService.js';
import {
  apiResponse,
  mockApiClient,
  printed,
  silenceConsole,
  spinnerMessages,
  type MockApiClient,
} from './helpers.js';

vi.mock('ora', async () => ({
  default: vi.fn((await import('./helpers.js')).createSpinner),
}));

const existingLocales = (items: { key: string; isEnabled: boolean }[]) =>
  apiResponse({ data: { items } });

describe('syncLocales', () => {
  let client: MockApiClient;
  let consoleSpies: ReturnType<typeof silenceConsole>;

  const sync = (locales: string[]) => syncLocales(locales, client as never);

  beforeEach(() => {
    vi.clearAllMocks();
    client = mockApiClient();
    consoleSpies = silenceConsole();
  });

  afterEach(() => vi.restoreAllMocks());

  test('does nothing for an empty locale list', async () => {
    await sync([]);

    expect(client.GET).not.toHaveBeenCalled();
    expect(ora).not.toHaveBeenCalled();
  });

  test('stops without throwing when existing locales cannot be fetched', async () => {
    client.GET.mockResolvedValue(
      apiResponse({ status: 500, error: { status: 500, detail: 'Database down' } }),
    );

    await expect(sync(['en'])).resolves.toBeUndefined();

    expect(spinnerMessages(ora, 'fail')).toEqual(['Failed to fetch existing locales']);
    expect(printed(consoleSpies.error)).toContain('500 Database down');
    expect(client.POST).not.toHaveBeenCalled();
  });

  test('creates missing locales, enables disabled ones and leaves enabled ones alone', async () => {
    client.GET.mockResolvedValue(
      existingLocales([
        { key: 'sv', isEnabled: false },
        { key: 'en', isEnabled: true },
      ]),
    );

    await sync(['en', 'sv', 'fr-CA']);

    expect(client.POST).toHaveBeenCalledTimes(1);
    expect(client.POST).toHaveBeenCalledWith(
      '/locales',
      expect.objectContaining({
        body: {
          key: 'fr-CA',
          displayName: 'Canadian French',
          isEnabled: true,
          routeSegment: 'fr-ca',
        },
      }),
    );
    expect(client.PATCH).toHaveBeenCalledTimes(1);
    expect(client.PATCH).toHaveBeenCalledWith(
      '/locales/{key}',
      expect.objectContaining({
        params: { path: { key: 'sv' } },
        body: { isEnabled: true },
        headers: { 'content-type': 'application/merge-patch+json' },
      }),
    );
    expect(spinnerMessages(ora, 'succeed')).toEqual([
      'Locales synced: 1 created, 1 enabled, 1 unchanged',
    ]);
  });

  test('sends the body as plain JSON', async () => {
    client.GET.mockResolvedValue(existingLocales([]));

    await sync(['en']);

    const { bodySerializer } = client.POST.mock.calls[0][1];
    expect(bodySerializer({ key: 'en' })).toBe('{"key":"en"}');
  });

  test('falls back to the tag itself as display name when it is not a valid locale', async () => {
    client.GET.mockResolvedValue(existingLocales([]));

    await sync(['not_a_tag!']);

    expect(client.POST.mock.calls[0][1].body).toMatchObject({
      displayName: 'not_a_tag!',
      routeSegment: 'not_a_tag!',
    });
  });

  test('counts failed creates and enables and prints their field errors', async () => {
    client.GET.mockResolvedValue(existingLocales([{ key: 'sv', isEnabled: false }]));
    client.POST.mockResolvedValue(
      apiResponse({
        error: {
          title: 'Invalid locale',
          errors: [{ detail: 'Unsupported', field: 'key' }],
        },
      }),
    );
    client.PATCH.mockResolvedValue(apiResponse({ error: { detail: 'Locked' } }));

    await sync(['xx', 'sv']);

    expect(spinnerMessages(ora, 'warn')).toEqual([
      'Failed to create locale xx: Invalid locale',
      'Failed to enable locale sv: Locked',
    ]);
    expect(printed(consoleSpies.log)).toContain('- Unsupported (field: key)');
    expect(spinnerMessages(ora, 'succeed')).toEqual([
      'Locales synced: 0 created, 0 enabled, 0 unchanged, 2 failed',
    ]);
  });

  test('reports an unknown error when the failure has no detail or title', async () => {
    client.GET.mockResolvedValue(existingLocales([{ key: 'sv', isEnabled: false }]));
    client.PATCH.mockResolvedValue(
      apiResponse({ error: { errors: [{ detail: 'Read-only', field: 'isEnabled' }] } }),
    );

    await sync(['sv']);

    expect(spinnerMessages(ora, 'warn')).toEqual(['Failed to enable locale sv: Unknown error']);
    expect(printed(consoleSpies.log)).toContain('- Read-only (field: isEnabled)');
  });
});
