import { afterEach, describe, expect, it, vi } from 'vitest';
import { readHostingCredentials } from '../service/config.js';

describe('readHostingCredentials', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns the credentials when all variables are set', () => {
    vi.stubEnv('OPTIMIZELY_DXP_PROJECT_ID', 'project');
    vi.stubEnv('OPTIMIZELY_DXP_CLIENT_KEY', 'key');
    vi.stubEnv('OPTIMIZELY_DXP_CLIENT_SECRET', 'secret');

    expect(readHostingCredentials()).toEqual({
      projectId: 'project',
      clientKey: 'key',
      clientSecret: 'secret',
    });
  });

  it('names only the missing variables', () => {
    vi.stubEnv('OPTIMIZELY_DXP_PROJECT_ID', 'project');
    vi.stubEnv('OPTIMIZELY_DXP_CLIENT_KEY', '');
    vi.stubEnv('OPTIMIZELY_DXP_CLIENT_SECRET', '');

    expect(() => readHostingCredentials()).toThrow(
      /`OPTIMIZELY_DXP_CLIENT_KEY`, `OPTIMIZELY_DXP_CLIENT_SECRET`/,
    );
  });

  it('never includes the secret value in the error', () => {
    vi.stubEnv('OPTIMIZELY_DXP_PROJECT_ID', '');
    vi.stubEnv('OPTIMIZELY_DXP_CLIENT_KEY', 'key');
    vi.stubEnv('OPTIMIZELY_DXP_CLIENT_SECRET', 'super-secret');

    expect(() => readHostingCredentials()).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining('super-secret'),
      }),
    );
  });
});
