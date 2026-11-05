import { describe, test, expect } from 'vitest';
import type { ApplicationsType } from '@optimizely/cms-sdk/buildConfig';
import { contract } from '@optimizely/cms-sdk';
import {
  previewableContentTypeKeys,
  validateApplications,
  type AnyContentType,
} from '../service/utils.js';

const app: ApplicationsType = {
  key: 'site',
  displayName: 'Site',
  type: 'website',
  hosts: [{ authority: 'example.com' }],
};

const validate = (applications: unknown) =>
  validateApplications(applications as ApplicationsType[]);

describe('validateApplications', () => {
  test('returns valid applications unchanged', () => {
    const applications = [app, { ...app, key: 'other', hosts: undefined }];

    expect(validate(applications)).toBe(applications);
  });

  test('rejects a value that is not an array', () => {
    expect(() => validate(app)).toThrow(
      'Validation error: "applications" must be an array in the config file',
    );
  });

  test.each(['key', 'displayName', 'type'])('rejects an application without %s', field => {
    expect(() => validate([app, { ...app, [field]: undefined }])).toThrow(
      `Error in applications: Application at index 1 has an empty or missing "${field}" field`,
    );
  });

  test('rejects a whitespace-only required field', () => {
    expect(() => validate([{ ...app, displayName: '  ' }])).toThrow(
      'Application at index 0 has an empty or missing "displayName" field',
    );
  });

  test('rejects a host without authority', () => {
    expect(() =>
      validate([{ ...app, hosts: [{ authority: 'example.com' }, { locale: 'en' }] }]),
    ).toThrow('Error in hosts: Host at index 1 has an empty or missing "authority" field');
  });
});

describe('componentPreviewUrlFormats keys', () => {
  const withFormats = (componentPreviewUrlFormats: Record<string, string>) => [
    { ...app, componentPreviewUrlFormats },
  ];

  const projectKeys = previewableContentTypeKeys([
    { key: 'HeroComponent', displayName: 'Hero', baseType: '_component' },
    { key: 'Folder', displayName: 'Folder', baseType: '_folder' },
    contract({ key: 'Seo', displayName: 'SEO' }) as unknown as AnyContentType,
  ]);

  test('accepts the fallback, previewable base types and a project content type', () => {
    const applications = withFormats({
      any: '{host}/preview?key={key}',
      _component: '{host}/preview/component?key={key}',
      _page: '{host}/preview?key={key}',
      _experience: '{host}/preview?key={key}',
      _image: '{host}/preview?key={key}',
      HeroComponent: '{host}/preview/hero?key={key}',
    });

    expect(validateApplications(applications as ApplicationsType[], projectKeys)).toBe(
      applications,
    );
  });

  test('rejects _folder, which is never rendered', () => {
    expect(() =>
      validateApplications(
        withFormats({ _folder: '{host}/preview?key={key}' }) as ApplicationsType[],
        projectKeys,
      ),
    ).toThrow('componentPreviewUrlFormats keys that name nothing previewable: _folder');
  });

  test('rejects a contract key and an unknown key', () => {
    expect(() =>
      validateApplications(
        withFormats({
          Seo: '{host}/preview?key={key}',
          Nonexistent: '{host}/preview?key={key}',
        }) as ApplicationsType[],
        projectKeys,
      ),
    ).toThrow('Seo, Nonexistent');
  });

  test('passes when no componentPreviewUrlFormats are configured', () => {
    expect(() => validate([app])).not.toThrow();
  });
});
