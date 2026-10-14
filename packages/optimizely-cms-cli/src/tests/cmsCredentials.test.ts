import { describe, test, expect, vi, afterEach } from 'vitest';
import { readEnvCredentials } from '../service/config.js';
import { credentialErrors } from '../service/error.js';

describe('readEnvCredentials', () => {
  afterEach(() => vi.unstubAllEnvs());

  test('returns the client id and secret when both are set', () => {
    vi.stubEnv('OPTIMIZELY_CMS_CLIENT_ID', 'id');
    vi.stubEnv('OPTIMIZELY_CMS_CLIENT_SECRET', 'secret');

    expect(readEnvCredentials()).toEqual({ clientId: 'id', clientSecret: 'secret' });
  });

  test.each([
    ['the secret is missing', 'id', ''],
    ['the id is missing', '', 'secret'],
    ['both are missing', '', ''],
  ])('throws MissingCredentials when %s', (_, clientId, clientSecret) => {
    vi.stubEnv('OPTIMIZELY_CMS_CLIENT_ID', clientId);
    vi.stubEnv('OPTIMIZELY_CMS_CLIENT_SECRET', clientSecret);

    expect(() => readEnvCredentials()).toThrow(credentialErrors.MissingCredentials);
    expect(() => readEnvCredentials()).toThrow('OPTIMIZELY_CMS_CLIENT_ID');
  });
});

describe('credentialErrors', () => {
  test('InvalidCredentials exits with code 1', () => {
    const error = new credentialErrors.InvalidCredentials();

    expect(error.message).toBe('The client credentials are invalid');
    expect(error.oclif.exit).toBe(1);
  });
});
