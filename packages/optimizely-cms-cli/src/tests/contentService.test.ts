import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { processContentWithApplications } from '../service/contentService.js';
import { createApiClient } from '../service/cmsRestClient.js';
import {
  apiResponse,
  mockApiClient,
  printed,
  respondByPath,
  silenceConsole,
  type MockApiClient,
} from './helpers.js';

vi.mock('../service/cmsRestClient.js');

// uuidv5('home', CONTENT_NAMESPACE) without hyphens; must never change or existing content is orphaned
const HOME_KEY = '53b05cc6eee45cd9aef40172fc47ea8c';

const home = { key: 'home', displayName: 'Home', contentType: 'StartPage' };
const site = () => ({ key: 'site', displayName: 'Site', entryPoint: 'home' });

describe('processContentWithApplications', () => {
  let client: MockApiClient;
  let consoleSpies: ReturnType<typeof silenceConsole>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = mockApiClient();
    vi.mocked(createApiClient).mockResolvedValue(client as never);
    consoleSpies = silenceConsole();
  });

  afterEach(() => vi.restoreAllMocks());

  test.each([
    ['empty', []],
    ['missing', undefined],
    ['not an array', 'home'],
  ])('does nothing when the content array is %s', async (_, contentArray) => {
    const app = site();

    await processContentWithApplications(contentArray as never, [app]);

    expect(createApiClient).not.toHaveBeenCalled();
    expect(app.entryPoint).toBe('home');
  });

  test('looks content up by a deterministic hyphen-less UUIDv5 key', async () => {
    client.GET.mockResolvedValue(apiResponse({ data: { key: HOME_KEY } }));

    await processContentWithApplications([home], [], 'https://cms.example.com');

    expect(createApiClient).toHaveBeenCalledWith('https://cms.example.com');
    expect(client.GET).toHaveBeenCalledWith('/content/{key}', {
      params: { path: { key: HOME_KEY } },
    });
  });

  test('maps the entryPoint to existing content without creating it', async () => {
    client.GET.mockResolvedValue(apiResponse({ data: { key: 'existing123' } }));
    const app = site();

    await processContentWithApplications([home], [app]);

    expect(app.entryPoint).toBe('cms://content/existing123');
    expect(client.POST).not.toHaveBeenCalled();
    expect(printed(consoleSpies.log)).toContain('Mapped "Site" entryPoint');
  });

  test('treats a 403 lookup as existing content under the deterministic key', async () => {
    client.GET.mockResolvedValue(apiResponse({ status: 403, error: { title: 'Forbidden' } }));
    const app = site();

    await processContentWithApplications([home], [app]);

    expect(app.entryPoint).toBe(`cms://content/${HOME_KEY}`);
    expect(client.POST).not.toHaveBeenCalled();
  });

  test('creates missing content under the root container after validating its type', async () => {
    respondByPath(client.GET, { '/contenttypes/{key}': apiResponse({ data: {} }) });
    client.POST.mockResolvedValue(apiResponse({ status: 201, data: { key: 'created456' } }));
    const app = site();

    await processContentWithApplications([{ ...home, locale: 'sv' }], [app]);

    expect(client.GET).toHaveBeenCalledWith('/contenttypes/{key}', {
      params: { path: { key: 'StartPage' } },
    });
    expect(client.POST).toHaveBeenCalledWith('/content', {
      body: {
        key: HOME_KEY,
        contentType: 'StartPage',
        container: '43f936c99b234ea397b261c538ad07c9',
        initialVersion: { displayName: 'Home', locale: 'sv', properties: {} },
      },
      params: {
        header: { 'cms-skip-validation': ['*'], Prefer: ['return=representation'] },
      },
    });
    expect(app.entryPoint).toBe('cms://content/created456');
  });

  test('defaults the locale of created content to en', async () => {
    respondByPath(client.GET, { '/contenttypes/{key}': apiResponse({ data: {} }) });
    client.POST.mockResolvedValue(apiResponse({ data: { key: 'created456' } }));

    await processContentWithApplications([home], []);

    expect(client.POST.mock.calls[0][1].body.initialVersion.locale).toBe('en');
  });

  test('uses the deterministic key when creation reports a 409 conflict', async () => {
    respondByPath(client.GET, { '/contenttypes/{key}': apiResponse({ data: {} }) });
    client.POST.mockResolvedValue(apiResponse({ status: 409, error: { title: 'Conflict' } }));
    const app = site();

    await processContentWithApplications([home], [app]);

    expect(app.entryPoint).toBe(`cms://content/${HOME_KEY}`);
  });

  test('fails when the content type does not exist', async () => {
    respondByPath(client.GET, {});

    await expect(processContentWithApplications([home], [site()])).rejects.toThrow(
      'ContentType "StartPage" not found.',
    );
    expect(client.POST).not.toHaveBeenCalled();
  });

  test('fails with the CMS error when creation is rejected', async () => {
    respondByPath(client.GET, { '/contenttypes/{key}': apiResponse({ data: {} }) });
    client.POST.mockResolvedValue(
      apiResponse({ status: 400, error: { title: 'Bad Request', detail: 'Invalid name' } }),
    );

    await expect(processContentWithApplications([home], [])).rejects.toThrow(
      'Failed to create content "home": Bad Request. Details: Invalid name',
    );
  });

  test('fails when creation succeeds without returning a key', async () => {
    respondByPath(client.GET, { '/contenttypes/{key}': apiResponse({ data: {} }) });
    client.POST.mockResolvedValue(apiResponse({ data: {} }));

    await expect(processContentWithApplications([home], [])).rejects.toThrow(
      'No data returned from content creation for "home"',
    );
  });

  test('warns when an entryPoint names content that is not configured', async () => {
    client.GET.mockResolvedValue(apiResponse({ data: { key: 'existing123' } }));
    const app = { ...site(), entryPoint: 'about' };

    await processContentWithApplications([home], [app]);

    expect(app.entryPoint).toBe('about');
    expect(printed(consoleSpies.warn)).toContain(
      'Warning: Content "about" not found for application "Site"',
    );
  });

  test.each(['cms://content/abc', 'content://abc'])(
    'keeps an entryPoint that is already a content reference (%s)',
    async entryPoint => {
      client.GET.mockResolvedValue(apiResponse({ data: { key: 'existing123' } }));
      const app = { ...site(), entryPoint };

      await processContentWithApplications([home], [app]);

      expect(app.entryPoint).toBe(entryPoint);
      expect(consoleSpies.warn).not.toHaveBeenCalled();
    },
  );
});
