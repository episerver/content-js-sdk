import { describe, it, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ora from 'ora';
import {
  areHostsEqual,
  arePreviewUrlFormatsEqual,
  checkApplication,
  checkApplications,
  detectApplicationChanges,
} from '../service/applicationService.js';
import { createApiClient } from '../service/cmsRestClient.js';
import type { components } from '../service/apiSchema/openapi-schema-types.js';
import type { ApplicationsType } from '@optimizely/cms-sdk/buildConfig';
import {
  apiResponse,
  mockApiClient,
  printed,
  respondByPath,
  silenceConsole,
  spinnerMessages,
  type MockApiClient,
} from './helpers.js';

vi.mock('../service/cmsRestClient.js');
vi.mock('ora', async () => ({
  default: vi.fn((await import('./helpers.js')).createSpinner),
}));

type Application = components['schemas']['Application'];

describe('areHostsEqual', () => {
  it('returns true when both arrays are undefined', () => {
    expect(areHostsEqual(undefined, undefined)).toBe(true);
  });

  it('returns true when both arrays are empty', () => {
    expect(areHostsEqual([], [])).toBe(true);
  });

  it('returns false when one array is undefined', () => {
    expect(areHostsEqual(undefined, [])).toBe(false);
    expect(areHostsEqual([], undefined)).toBe(false);
  });

  it('returns false when arrays have different lengths', () => {
    const hosts1 = [{ authority: 'localhost:3000', type: 'primary' }];
    const hosts2 = [
      { authority: 'localhost:3000', type: 'primary' },
      { authority: 'localhost:3001', type: 'secondary' },
    ];
    expect(areHostsEqual(hosts1, hosts2)).toBe(false);
  });

  it('returns true when arrays have identical hosts', () => {
    const hosts1 = [
      {
        authority: 'localhost:3000',
        type: 'primary',
        locale: 'en',
        preferredUrlScheme: 'https',
      },
    ];
    const hosts2 = [
      {
        authority: 'localhost:3000',
        type: 'primary',
        locale: 'en',
        preferredUrlScheme: 'https',
      },
    ];
    expect(areHostsEqual(hosts1, hosts2)).toBe(true);
  });

  it('returns false when hosts differ in authority', () => {
    const hosts1 = [{ authority: 'localhost:3000', type: 'primary' }];
    const hosts2 = [{ authority: 'localhost:3001', type: 'primary' }];
    expect(areHostsEqual(hosts1, hosts2)).toBe(false);
  });

  it('returns false when hosts differ in type', () => {
    const hosts1 = [{ authority: 'localhost:3000', type: 'primary' }];
    const hosts2 = [{ authority: 'localhost:3000', type: 'default' }];
    expect(areHostsEqual(hosts1, hosts2)).toBe(false);
  });

  it('returns false when hosts differ in locale', () => {
    const hosts1 = [{ authority: 'localhost:3000', type: 'primary', locale: 'en' }];
    const hosts2 = [{ authority: 'localhost:3000', type: 'primary', locale: 'sv' }];
    expect(areHostsEqual(hosts1, hosts2)).toBe(false);
  });

  it('returns false when hosts differ in preferredUrlScheme', () => {
    const hosts1 = [{ authority: 'localhost:3000', type: 'primary', preferredUrlScheme: 'https' }];
    const hosts2 = [{ authority: 'localhost:3000', type: 'primary', preferredUrlScheme: 'http' }];
    expect(areHostsEqual(hosts1, hosts2)).toBe(false);
  });

  it('returns false when arrays have same hosts in different order', () => {
    const hosts1 = [
      { authority: 'localhost:3000', type: 'primary' },
      { authority: 'localhost:3001', type: 'default' },
    ];
    const hosts2 = [
      { authority: 'localhost:3001', type: 'default' },
      { authority: 'localhost:3000', type: 'primary' },
    ];
    expect(areHostsEqual(hosts1, hosts2)).toBe(false);
  });
});

describe('arePreviewUrlFormatsEqual', () => {
  it('returns true when both objects are undefined', () => {
    expect(arePreviewUrlFormatsEqual(undefined, undefined)).toBe(true);
  });

  it('returns true when both objects are empty', () => {
    expect(arePreviewUrlFormatsEqual({}, {})).toBe(true);
  });

  it('returns false when one object is undefined', () => {
    expect(arePreviewUrlFormatsEqual(undefined, {})).toBe(false);
    expect(arePreviewUrlFormatsEqual({}, undefined)).toBe(false);
  });

  it('returns true when objects have identical key-value pairs', () => {
    const formats1 = { any: '/preview?key={key}' };
    const formats2 = { any: '/preview?key={key}' };
    expect(arePreviewUrlFormatsEqual(formats1, formats2)).toBe(true);
  });

  it('returns false when objects have different values for same key', () => {
    const formats1 = { any: '/preview?key={key}' };
    const formats2 = { any: '/preview?id={key}' };
    expect(arePreviewUrlFormatsEqual(formats1, formats2)).toBe(false);
  });

  it('returns false when objects have different keys', () => {
    const formats1 = { any: '/preview?key={key}' };
    const formats2 = { all: '/preview?key={key}' };
    expect(arePreviewUrlFormatsEqual(formats1, formats2)).toBe(false);
  });

  it('returns false when objects have different number of keys', () => {
    const formats1 = { any: '/preview?key={key}' };
    const formats2 = {
      any: '/preview?key={key}',
      BlogPage: '/blog/preview?key={key}',
    };
    expect(arePreviewUrlFormatsEqual(formats1, formats2)).toBe(false);
  });

  it('returns true for multiple identical key-value pairs regardless of insertion order', () => {
    const formats1 = {
      any: '/preview?key={key}',
      BlogPage: '/blog/preview?key={key}',
      ArticlePage: '/article/preview?key={key}',
    };
    const formats2 = {
      BlogPage: '/blog/preview?key={key}',
      ArticlePage: '/article/preview?key={key}',
      any: '/preview?key={key}',
    };
    expect(arePreviewUrlFormatsEqual(formats1, formats2)).toBe(true);
  });
});

describe('detectApplicationChanges', () => {
  const baseExistingApp: Application = {
    key: 'test_app',
    displayName: 'Test App',
    type: {} as any,
    entryPoint: 'content://test-entry-point',
    isDefault: false,
    useApplicationSpecificAssets: false,
    hosts: [{ authority: 'localhost:3000', type: 'primary' as any }],
    usePreviewTokens: true,
    previewUrlFormats: { any: '/preview?key={key}' },
  };

  const baseConfigApp: ApplicationsType = {
    key: 'test_app',
    displayName: 'Test App',
    type: 'website',
    entryPoint: 'content://test-entry-point',
    isDefault: false,
    useApplicationSpecificAssets: false,
    hosts: [{ authority: 'localhost:3000', type: 'primary' }],
    usePreviewTokens: true,
    previewUrlFormats: { any: '/preview?key={key}' },
  };

  it('returns null when no changes detected', () => {
    const result = detectApplicationChanges(baseExistingApp, baseConfigApp);
    expect(result).toBeNull();
  });

  it('detects displayName change', () => {
    const configApp = { ...baseConfigApp, displayName: 'Updated App' };
    const result = detectApplicationChanges(baseExistingApp, configApp);
    expect(result).toEqual({ displayName: 'Updated App' });
  });

  it('detects type change', () => {
    const existingApp = { ...baseExistingApp, type: 'website' as any };
    const configApp: ApplicationsType = {
      key: 'test_app',
      displayName: 'Test App',
      type: 'inProcessWebsite',
      entryPoint: 'content://test-entry-point',
      isDefault: false,
      useApplicationSpecificAssets: false,
      hosts: [{ authority: 'localhost:3000', type: 'primary' }],
    };
    const result = detectApplicationChanges(existingApp, configApp);
    expect(result?.type).toBe('inProcessWebsite');
  });

  it('detects entryPoint change', () => {
    const configApp = { ...baseConfigApp, entryPoint: 'content://new-entry-point' };
    const result = detectApplicationChanges(baseExistingApp, configApp);
    expect(result).toEqual({ entryPoint: 'content://new-entry-point' });
  });

  it('detects isDefault change from false to true', () => {
    const configApp = { ...baseConfigApp, isDefault: true };
    const result = detectApplicationChanges(baseExistingApp, configApp);
    expect(result).toEqual({ isDefault: true });
  });

  it('detects isDefault change from true to false', () => {
    const existingApp = { ...baseExistingApp, isDefault: true };
    const result = detectApplicationChanges(existingApp, baseConfigApp);
    expect(result).toEqual({ isDefault: false });
  });

  it('detects useApplicationSpecificAssets change', () => {
    const configApp = { ...baseConfigApp, useApplicationSpecificAssets: true };
    const result = detectApplicationChanges(baseExistingApp, configApp);
    expect(result).toEqual({ useApplicationSpecificAssets: true });
  });

  it('detects usePreviewTokens change for website type', () => {
    const configApp = { ...baseConfigApp, usePreviewTokens: false };
    const result = detectApplicationChanges(baseExistingApp, configApp);
    expect(result).toEqual({ usePreviewTokens: false });
  });

  it('does not include usePreviewTokens for inProcessWebsite type', () => {
    const existingApp = { ...baseExistingApp, type: 'inProcessWebsite' as any };
    const configApp: ApplicationsType = {
      key: 'test_app',
      displayName: 'Updated App',
      type: 'inProcessWebsite',
      entryPoint: 'content://test-entry-point',
      isDefault: false,
      useApplicationSpecificAssets: false,
      hosts: [{ authority: 'localhost:3000', type: 'primary' }],
    };
    const result = detectApplicationChanges(existingApp, configApp);
    expect(result).toEqual({ displayName: 'Updated App' });
  });

  it('detects hosts change', () => {
    const configApp: ApplicationsType = {
      ...baseConfigApp,
      hosts: [{ authority: 'localhost:3001', type: 'primary' }],
    };
    const result = detectApplicationChanges(baseExistingApp, configApp);
    expect(result?.hosts).toEqual([{ authority: 'localhost:3001', type: 'primary' }]);
  });

  it('detects previewUrlFormats change for website type', () => {
    const configApp = {
      ...baseConfigApp,
      previewUrlFormats: { any: '/new-preview?key={key}' },
    };
    const result = detectApplicationChanges(baseExistingApp, configApp);
    expect(result?.previewUrlFormats).toEqual({ any: '/new-preview?key={key}' });
  });

  it('does not include previewUrlFormats for inProcessWebsite type', () => {
    const existingApp = { ...baseExistingApp, type: 'inProcessWebsite' as any };
    const configApp: ApplicationsType = {
      key: 'test_app',
      displayName: 'Updated App',
      type: 'inProcessWebsite',
      entryPoint: 'content://test-entry-point',
      isDefault: false,
      useApplicationSpecificAssets: false,
      hosts: [{ authority: 'localhost:3000', type: 'primary' }],
    };
    const result = detectApplicationChanges(existingApp, configApp);
    expect(result?.previewUrlFormats).toBeUndefined();
  });

  it('detects every changed field at once', () => {
    const existingApp: Application = {
      key: 'app1',
      displayName: 'Old App',
      type: 'website' as any,
      entryPoint: 'content://old-entry',
      isDefault: false,
      useApplicationSpecificAssets: false,
      hosts: [{ authority: 'old.com', type: 'primary' as any }],
      usePreviewTokens: false,
      previewUrlFormats: { any: '/old-preview' },
    };

    const configApp: ApplicationsType = {
      key: 'app1',
      displayName: 'New App',
      type: 'website',
      entryPoint: 'content://new-entry',
      isDefault: true,
      useApplicationSpecificAssets: true,
      hosts: [
        { authority: 'new.com', type: 'primary' },
        { authority: 'new2.com', type: 'default' },
      ],
      usePreviewTokens: true,
      previewUrlFormats: {
        any: '/new-preview',
        BlogPage: '/blog-preview',
      },
    };

    const result = detectApplicationChanges(existingApp, configApp);
    expect(result).toEqual({
      displayName: 'New App',
      entryPoint: 'content://new-entry',
      isDefault: true,
      useApplicationSpecificAssets: true,
      hosts: [
        { authority: 'new.com', type: 'primary' },
        { authority: 'new2.com', type: 'default' },
      ],
      usePreviewTokens: true,
      previewUrlFormats: {
        any: '/new-preview',
        BlogPage: '/blog-preview',
      },
    });
  });

  test('ignores an entryPoint that is not a content reference', () => {
    const configApp = { ...baseConfigApp, entryPoint: 'home-page' };

    expect(detectApplicationChanges(baseExistingApp, configApp)).toBeNull();
  });

  it('handles undefined hosts in existing app', () => {
    const existingApp = { ...baseExistingApp, hosts: undefined };
    const result = detectApplicationChanges(existingApp, baseConfigApp);
    expect(result?.hosts).toEqual(baseConfigApp.hosts);
  });

  it('handles undefined previewUrlFormats in existing app', () => {
    const existingApp = { ...baseExistingApp, previewUrlFormats: undefined };
    const result = detectApplicationChanges(existingApp, baseConfigApp);
    expect(result?.previewUrlFormats).toEqual(baseConfigApp.previewUrlFormats);
  });
});

describe('application API operations', () => {
  const app: ApplicationsType = {
    key: 'site',
    displayName: 'Site',
    type: 'website',
    entryPoint: 'cms://content/abc',
    hosts: [{ authority: 'example.com' }],
  };
  const notFound = apiResponse({ status: 404, error: { status: 404, title: 'Not Found' } });

  let client: MockApiClient;
  let consoleSpies: ReturnType<typeof silenceConsole>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = mockApiClient();
    vi.mocked(createApiClient).mockResolvedValue(client as never);
    consoleSpies = silenceConsole();
  });

  afterEach(() => vi.restoreAllMocks());

  describe('checkApplication', () => {
    test('rejects an application without a key', async () => {
      await expect(checkApplication({ ...app, key: undefined })).rejects.toThrow(
        'Application key is required',
      );
      expect(client.GET).not.toHaveBeenCalled();
    });

    test('reports an existing application without creating it', async () => {
      client.GET.mockResolvedValue(apiResponse({ data: { key: 'site' } }));

      await expect(checkApplication(app, 'https://cms.example.com')).resolves.toEqual({
        key: 'site',
        existed: true,
      });
      expect(createApiClient).toHaveBeenCalledWith('https://cms.example.com');
      expect(client.GET).toHaveBeenCalledWith('/applications/{key}', {
        params: { path: { key: 'site' } },
      });
      expect(client.POST).not.toHaveBeenCalled();
    });

    test('creates a missing application and returns the key from the CMS', async () => {
      client.GET.mockResolvedValue(notFound);
      client.POST.mockResolvedValue(apiResponse({ data: { key: 'site-created' } }));

      await expect(checkApplication(app)).resolves.toEqual({
        key: 'site-created',
        existed: false,
      });
      expect(client.POST).toHaveBeenCalledWith(
        '/applications',
        expect.objectContaining({ body: app }),
      );
    });

    test('fails when the CMS creates the application but returns no key', async () => {
      client.GET.mockResolvedValue(notFound);
      client.POST.mockResolvedValue(apiResponse({ data: {} }));

      await expect(checkApplication(app)).rejects.toThrow(
        'Failed to create application: no key returned',
      );
    });

    test('lists every field error when creation fails with errors[]', async () => {
      client.GET.mockResolvedValue(notFound);
      client.POST.mockResolvedValue(
        apiResponse({
          error: {
            title: 'Validation failed',
            errors: [{ field: 'hosts', detail: 'Host is taken' }, { detail: 'Other problem' }],
          },
        }),
      );

      await expect(checkApplication(app)).rejects.toThrow(
        'Failed to create application: Validation failed\n  [hosts] Host is taken\n   Other problem',
      );
    });

    test('includes the detail when creation fails without errors[]', async () => {
      client.GET.mockResolvedValue(notFound);
      client.POST.mockResolvedValue(
        apiResponse({ status: 409, error: { title: 'Conflict', detail: 'Already exists' } }),
      );

      await expect(checkApplication(app)).rejects.toThrow(
        'Failed to create application: Conflict. Details: Already exists',
      );
    });

    test('fails on a lookup error other than 404', async () => {
      client.GET.mockResolvedValue(apiResponse({ status: 403, error: { title: 'Forbidden' } }));

      await expect(checkApplication(app)).rejects.toThrow(
        'Failed to get application: Forbidden',
      );
      expect(client.POST).not.toHaveBeenCalled();
    });
  });

  describe('checkApplications', () => {
    test('returns true without contacting the CMS when no application is configured', async () => {
      await expect(checkApplications([], undefined)).resolves.toBe(true);
      expect(createApiClient).not.toHaveBeenCalled();
    });

    test('leaves up-to-date applications untouched', async () => {
      const existing = { ...app, previewUrlFormats: undefined };
      client.GET.mockResolvedValue(apiResponse({ data: existing }));

      await checkApplications([{ ...app }], undefined);

      expect(spinnerMessages(ora, 'succeed')).toEqual(
        expect.arrayContaining([
          'All applications exist, checking for updates',
          'Application "Site" is up to date (site)',
        ]),
      );
      expect(client.POST).not.toHaveBeenCalled();
      expect(client.PATCH).not.toHaveBeenCalled();
    });

    test('patches an existing application whose config changed', async () => {
      client.GET.mockResolvedValue(apiResponse({ data: { ...app, displayName: 'Old' } }));

      await checkApplications([{ ...app }], undefined);

      expect(client.PATCH).toHaveBeenCalledWith(
        '/applications/{key}',
        expect.objectContaining({
          params: { path: { key: 'site' } },
          body: { displayName: 'Site' },
          headers: { 'Content-Type': 'application/merge-patch+json' },
        }),
      );
      expect(spinnerMessages(ora, 'succeed')).toContain('Application "Site" updated (site)');
    });

    test('fails when patching an existing application is rejected', async () => {
      client.GET.mockResolvedValue(apiResponse({ data: { ...app, displayName: 'Old' } }));
      client.PATCH.mockResolvedValue(apiResponse({ error: { title: 'Bad patch', detail: 'nope' } }));

      await expect(checkApplications([{ ...app }], undefined)).rejects.toThrow(
        'Failed to update application: Bad patch. Details: nope',
      );
      expect(spinnerMessages(ora, 'fail')).toContain('Failed to ensure application "Site"');
    });

    test('creates missing website applications with the default preview URL format', async () => {
      client.GET.mockResolvedValue(notFound);
      client.POST.mockResolvedValue(apiResponse({ data: { key: 'site' } }));

      await checkApplications([{ ...app }], undefined);

      expect(spinnerMessages(ora, 'info')).toContain('Some applications need setup');
      expect(client.POST).toHaveBeenCalledWith(
        '/applications',
        expect.objectContaining({
          body: expect.objectContaining({
            key: 'site',
            previewUrlFormats: {
              any: '{host}/preview?key={key}&ver={version}&loc={locale}&ctx={context}',
            },
          }),
        }),
      );
      expect(spinnerMessages(ora, 'succeed')).toContain('Application "Site" created (site)');
    });

    test('creates missing in-process applications without preview URL formats', async () => {
      const inProcess: ApplicationsType = { ...app, type: 'inProcessWebsite' };
      client.GET.mockResolvedValue(notFound);
      client.POST.mockResolvedValue(apiResponse({ data: { key: 'site' } }));

      await checkApplications([inProcess], undefined);

      expect(client.POST.mock.calls[0][1].body).not.toHaveProperty('previewUrlFormats');
    });

    test('refuses to create an application without an entryPoint', async () => {
      client.GET.mockResolvedValue(notFound);

      await expect(
        checkApplications([{ ...app, entryPoint: undefined }], undefined),
      ).rejects.toThrow('No entryPoint defined for application site');
      expect(printed(consoleSpies.error)).toContain(
        'Configure entryPoint in application config via content array',
      );
      expect(client.POST).not.toHaveBeenCalled();
    });

    test('refuses website-only fields on a new in-process application', async () => {
      const inProcess = { ...app, type: 'inProcessWebsite', usePreviewTokens: true };
      client.GET.mockResolvedValue(notFound);

      await expect(
        checkApplications([inProcess as unknown as ApplicationsType], undefined),
      ).rejects.toThrow('Invalid fields for inProcessWebsite application site');
      expect(printed(consoleSpies.error)).toContain(
        "Fields 'usePreviewTokens' and 'previewUrlFormats' are only valid for type 'website'",
      );
    });

    test('explains overlapping entry points reported by the CMS', async () => {
      client.GET.mockResolvedValue(notFound);
      client.POST.mockResolvedValue(
        apiResponse({ error: { title: 'Application entry points cannot overlap' } }),
      );

      await expect(checkApplications([{ ...app }], undefined)).rejects.toThrow(
        'entry points cannot overlap',
      );
      expect(printed(consoleSpies.error)).toContain(
        'The entry point for "Site" is already in use by another application.',
      );
    });

    test('stops before touching applications when content processing fails', async () => {
      respondByPath(client.GET, {
        '/contenttypes/{key}': apiResponse({ status: 404 }),
      });
      const content = [{ key: 'home', displayName: 'Home', contentType: 'Missing' }];

      await expect(checkApplications([{ ...app }], content)).rejects.toThrow(
        'ContentType "Missing" not found.',
      );
      expect(spinnerMessages(ora, 'fail')).toContain('Failed to process content configuration');
      expect(client.POST).not.toHaveBeenCalled();
    });
  });
});
