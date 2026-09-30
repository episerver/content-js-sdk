import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createJsonSubmitHandler } from '../forms/jsonSubmitHandler.js';

const fetchMock = vi.fn();

const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body);

describe('createJsonSubmitHandler', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
  });

  test('posts the action, payload and form key as JSON', async () => {
    const data = new FormData();
    data.append('email', 'someone@example.com');

    await createJsonSubmitHandler('/api/submit', 'form-1')(data, { action: 'https://hook' });

    expect(fetchMock).toHaveBeenCalledWith('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
    expect(sentBody()).toEqual({
      targetUrl: 'https://hook',
      payload: { email: 'someone@example.com' },
      formKey: 'form-1',
    });
  });

  test('a repeated name becomes an array, and files are dropped', async () => {
    const data = new FormData();
    data.append('choice', 'a');
    data.append('choice', 'b');
    data.append('choice', 'c');
    data.append('upload', new Blob(['x']));

    await createJsonSubmitHandler('/api/submit')(data, { action: '' });

    expect(sentBody()).toEqual({ targetUrl: '', payload: { choice: ['a', 'b', 'c'] }, formKey: '' });
  });

  test('a failed response throws with the status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502 });

    await expect(
      createJsonSubmitHandler('/api/submit')(new FormData(), { action: '' }),
    ).rejects.toThrow('Submission failed with status 502');
  });
});
