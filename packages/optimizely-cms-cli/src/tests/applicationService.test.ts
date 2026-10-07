import { describe, it, expect } from 'vitest';
import {
  areHostsEqual,
  arePreviewUrlFormatsEqual,
  detectApplicationChanges,
} from '../service/applicationService.js';
import type { components } from '../service/apiSchema/openapi-schema-types.js';
import type { ApplicationsType } from '@optimizely/cms-sdk/buildConfig';

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

  it('returns true for multiple identical hosts', () => {
    const hosts1 = [
      { authority: 'localhost:3000', type: 'primary', locale: 'en' },
      { authority: 'localhost:3001', type: 'default', locale: 'sv' },
      { authority: 'example.com', type: 'primary', preferredUrlScheme: 'https' as const },
    ];
    const hosts2 = [
      { authority: 'localhost:3000', type: 'primary', locale: 'en' },
      { authority: 'localhost:3001', type: 'default', locale: 'sv' },
      { authority: 'example.com', type: 'primary', preferredUrlScheme: 'https' as const },
    ];
    expect(areHostsEqual(hosts1, hosts2)).toBe(true);
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

  it('returns false when one key differs in multiple key-value pairs', () => {
    const formats1 = {
      any: '/preview?key={key}',
      BlogPage: '/blog/preview?key={key}',
    };
    const formats2 = {
      any: '/preview?key={key}',
      BlogPage: '/blog/preview?id={key}',
    };
    expect(arePreviewUrlFormatsEqual(formats1, formats2)).toBe(false);
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

  it('detects multiple changes at once', () => {
    const configApp = {
      ...baseConfigApp,
      displayName: 'Updated App',
      entryPoint: 'content://new-entry-point',
      isDefault: true,
      usePreviewTokens: false,
    };
    const result = detectApplicationChanges(baseExistingApp, configApp);
    expect(result).toEqual({
      displayName: 'Updated App',
      entryPoint: 'content://new-entry-point',
      isDefault: true,
      usePreviewTokens: false,
    });
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

  it('normalizes type field when existing app type is object', () => {
    const existingApp = { ...baseExistingApp, type: {} as any };
    const configApp = { ...baseConfigApp, type: 'website' as const };
    const result = detectApplicationChanges(existingApp, configApp);
    expect(result).toBeNull();
  });

  it('detects all field changes comprehensively', () => {
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
});
