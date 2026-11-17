import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { register } from './index.js';

const registerWebhook = vi.hoisted(() => vi.fn(async () => {}));

vi.mock('../shared/webhooks.js', () => ({ registerWebhook }));

beforeEach(() => registerWebhook.mockClear());
afterEach(() => vi.unstubAllEnvs());

describe('register', () => {
  it('registers the webhook in the Node.js runtime', () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');

    register();

    expect(registerWebhook).toHaveBeenCalledOnce();
  });

  it('does nothing in the Edge runtime', () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');

    register();

    expect(registerWebhook).not.toHaveBeenCalled();
  });

  it('does not wait for the registration', () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    registerWebhook.mockReturnValueOnce(new Promise(() => {}));

    expect(register()).toBeUndefined();
  });
});
