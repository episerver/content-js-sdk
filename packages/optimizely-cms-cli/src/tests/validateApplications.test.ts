import { describe, test, expect } from 'vitest';
import type { ApplicationsType } from '@optimizely/cms-sdk/buildConfig';
import { validateApplications } from '../service/utils.js';

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
