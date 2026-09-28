import { describe, it, expect, vi } from 'vitest';
import { getItems, getPath } from '../operations.js';

/** A client stub that records what was sent and returns an empty-but-valid response. */
function recordingContext() {
  const sent: Array<{ query: string; variables: any }> = [];
  const context = {
    host: undefined,
    cache: true,
    slot: undefined,
    stored: true,
    request: vi.fn(async (query: string, variables: any) => {
      sent.push({ query, variables });
      return {
        _Content: {
          item: {
            _id: 'x',
            _metadata: { path: [] },
            _link: { _Page: { items: [] } },
          },
        },
      };
    }),
  } as any;
  return { context, sent };
}

describe('getItems/getPath locale handling', () => {
  it('does not filter on _metadata.locale, so language fallbacks resolve', async () => {
    const { context, sent } = recordingContext();

    await getItems(context, { key: 'abc', locale: 'en-PH' });

    // A fallback document keeps the locale it was authored in, so a
    // `_metadata.locale` filter would exclude it and return nothing.
    expect(sent[0].variables.metadataLocale).toBeUndefined();
    expect(sent[0].variables.locale).toEqual(['en_PH']);
  });

  it('converts BCP-47 locales to Locales enum identifiers', async () => {
    const { context, sent } = recordingContext();

    await getPath(context, { key: 'abc' }, { locales: ['en-BE', 'en'] });

    // `en-BE` is not a valid GraphQL enum name; the enum uses `en_BE`.
    expect(sent[0].variables.locale).toEqual(['en_BE', 'en']);
  });

  it('keeps version pinning while dropping the locale filter', async () => {
    const { context, sent } = recordingContext();

    await getItems(context, { key: 'abc', version: '42', locale: 'de' });

    expect(sent[0].variables).toMatchObject({ key: 'abc', version: '42', locale: ['de'] });
    expect(sent[0].variables.metadataLocale).toBeUndefined();
  });

  it('scopes the nested _Page by locale so children are not mixed', async () => {
    const { context, sent } = recordingContext();

    await getItems(context, '/de/', { locales: ['de'] });

    expect(sent[0].query).toContain('_Page(locale: $locale)');
  });
});
