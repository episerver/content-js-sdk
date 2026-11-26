import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { deleteItems } from '../service/deleteService.js';
import {
  apiResponse,
  mockApiClient,
  silenceConsole,
  type MockApiClient,
} from './helpers.js';

vi.mock('ora', async () => ({
  default: vi.fn((await import('./helpers.js')).createSpinner),
}));

describe('deleteItems', () => {
  let client: MockApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = mockApiClient();
    client.DELETE.mockResolvedValue(apiResponse({ status: 204 }));
    silenceConsole();
  });

  afterEach(() => vi.restoreAllMocks());

  test('deletes display templates, then content types, then property groups', async () => {
    await deleteItems(client as never, [
      'propertyGroups:seo',
      'contentTypes:Hero',
      'displayTemplates:HeroWide',
    ]);

    expect(client.DELETE.mock.calls).toEqual([
      ['/displaytemplates/{key}', { params: { path: { key: 'HeroWide' } } }],
      ['/contenttypes/{key}', { params: { path: { key: 'Hero' } } }],
      ['/propertygroups/{key}', { params: { path: { key: 'seo' } } }],
    ]);
  });

  test('reports deleted, missing and refused items, and keeps going after a failure', async () => {
    client.DELETE.mockImplementation(
      async (_: string, { params }: { params: { path: { key: string } } }) =>
        ({
          Hero: apiResponse({ status: 409, error: { status: 409 } }),
          Banner: apiResponse({ status: 404, error: { status: 404 } }),
          Tile: apiResponse({ status: 204 }),
        })[params.path.key],
    );

    expect(
      await deleteItems(client as never, [
        'contentTypes:Hero',
        'contentTypes:Banner',
        'contentTypes:Tile',
      ]),
    ).toEqual({
      'contentTypes:Hero': 'failed',
      'contentTypes:Banner': 'missing',
      'contentTypes:Tile': 'deleted',
    });
  });

  test('does nothing for no items', async () => {
    expect(await deleteItems(client as never, [])).toEqual({});
    expect(client.DELETE).not.toHaveBeenCalled();
  });
});
