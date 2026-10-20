import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ora from 'ora';
import Login from '../commands/login.js';
import { getToken } from '../service/cmsRestClient.js';
import { credentialErrors } from '../service/error.js';
import { ExitError, mockExit, printed, silenceConsole, spinnerMessages } from './helpers.js';

vi.mock('../service/cmsRestClient.js');
vi.mock('ora', async () => ({
  default: vi.fn((await import('./helpers.js')).createSpinner),
}));

describe('login', () => {
  let consoleSpies: ReturnType<typeof silenceConsole>;

  const login = (...args: string[]) => Login.run(args, import.meta.url);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('OPTIMIZELY_CMS_CLIENT_ID', 'client-id');
    vi.stubEnv('OPTIMIZELY_CMS_CLIENT_SECRET', 'client-secret');
    consoleSpies = silenceConsole();
    mockExit();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    process.exitCode = undefined;
  });

  test('fails before requesting a token when credentials are missing', async () => {
    vi.stubEnv('OPTIMIZELY_CMS_CLIENT_SECRET', '');

    await expect(login()).rejects.toBeInstanceOf(credentialErrors.MissingCredentials);
    expect(getToken).not.toHaveBeenCalled();
  });

  test('confirms valid credentials', async () => {
    vi.mocked(getToken).mockResolvedValue('token');

    await login('--host', 'https://cms.example.com');

    expect(getToken).toHaveBeenCalledWith('client-id', 'client-secret', 'https://cms.example.com');
    expect(spinnerMessages(ora, 'succeed')).toEqual(['Your credentials are correct']);
    expect(consoleSpies.log).not.toHaveBeenCalled();
  });

  test('prints the client id with --verbose', async () => {
    vi.mocked(getToken).mockResolvedValue('token');

    await login('--verbose');

    expect(printed(consoleSpies.log)).toContain('Client ID: client-id');
    expect(printed(consoleSpies.log)).toContain('Token received successfully');
  });

  test('exits when the API returns no token', async () => {
    vi.mocked(getToken).mockResolvedValue(undefined as never);

    await expect(login()).rejects.toThrow(ExitError);

    expect(spinnerMessages(ora, 'fail')[0]).toBe('The API did not return a token');
    expect(printed(consoleSpies.error)).toContain('No token received from the API');
  });

  test('reports a failed authentication', async () => {
    vi.mocked(getToken).mockRejectedValue(new credentialErrors.InvalidCredentials());

    await expect(login()).rejects.toThrow('The client credentials are invalid');

    expect(spinnerMessages(ora, 'fail')).toEqual(['Authentication failed']);
    expect(consoleSpies.error).not.toHaveBeenCalled();
  });

  test('prints the error details with --verbose', async () => {
    vi.mocked(getToken).mockRejectedValue(new Error('Token endpoint unreachable'));

    await expect(login('--verbose')).rejects.toThrow('Token endpoint unreachable');

    expect(printed(consoleSpies.error)).toContain('Error details: Token endpoint unreachable');
  });
});
