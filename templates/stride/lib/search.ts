import { getClient } from '@optimizely/cms-sdk';
import { unstable_cache } from 'next/cache';

export type SearchableContent = {
  key: string;
  displayName: string;
  url: string;
  type: string;
  heading?: string;
  intro?: string;
  body?: string;
  locale: string;
};

/**
 * Every searchable page and its text, in one request.
 *
 * Fetching each page on its own instead costs two requests apiece — one to
 * learn the content type, one for the content — and pulls in compositions and
 * media that search has no use for. Runs without a request context, which the
 * `/api/search` route has none of.
 */
const SEARCHABLE_CONTENT_QUERY = `
query SearchableContent($locale: [Locales], $skip: Int!) {
  _Page(locale: $locale, limit: 100, skip: $skip) {
    total
    items {
      _metadata {
        key
        displayName
        locale
        types
        url {
          default
        }
      }
      ... on StandardPage { heading intro { html } body { html } }
      ... on ProductPage { heading intro { html } body { html } }
      ... on NewsPage2 { heading body { html } }
    }
  }
}`;

type RawSearchablePage = {
  _metadata?: {
    key: string;
    displayName?: string;
    locale?: string;
    types: string[];
    url?: {
      default?: string;
    };
  };
  heading?: string;
  intro?: { html?: string };
  body?: { html?: string };
};

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/** Rich text arrives as markup; search only wants the words in it. */
const toPlainText = (html?: string) =>
  html ?
    html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, match => ENTITIES[match])
      .replace(/\s+/g, ' ')
      .trim() || undefined
  : undefined;

// one locale, because that is all the template routes. Take the
// locale as an argument once the site serves more than `/en`.
const fetchAllSearchableContent = async (locale = 'en'): Promise<SearchableContent[]> => {
  const byUrl = new Map<string, SearchableContent>();
  let total = 0;
  let fetched = 0;

  try {
    do {
      const data = await getClient().request(SEARCHABLE_CONTENT_QUERY, {
        locale: [locale],
        skip: fetched,
      });

      const items: RawSearchablePage[] = data?._Page?.items ?? [];
      total = data?._Page?.total ?? 0;

      if (items.length === 0) break;
      fetched += items.length;

      for (const item of items) {
        const metadata = item._metadata;
        const url = metadata?.url?.default;

        if (!metadata || !url) continue;
        if (metadata.types.includes('BlankExperience')) continue;
        // The same page can be reachable through more than one site root.
        if (byUrl.has(url)) continue;

        byUrl.set(url, {
          key: metadata.key,
          displayName: metadata.displayName || '',
          url,
          type: metadata.types[0] || 'Page',
          heading: item.heading || metadata.displayName || '',
          intro: toPlainText(item.intro?.html),
          body: toPlainText(item.body?.html),
          locale: metadata.locale || locale,
        });
      }
    } while (fetched < total);

    return [...byUrl.values()];
  } catch (error) {
    console.error('Error fetching searchable content:', error);
    return [];
  }
};

export const getAllSearchableContent = unstable_cache(
  fetchAllSearchableContent,
  ['searchable-content'],
  { revalidate: 3600 },
);

type SearchableContentWithLowercase = SearchableContent & {
  _lower: {
    displayName: string;
    heading: string;
    intro: string;
    body: string;
    url: string;
  };
};

const addLowercaseFields = (item: SearchableContent): SearchableContentWithLowercase => ({
  ...item,
  _lower: {
    displayName: item.displayName.toLowerCase(),
    heading: (item.heading || '').toLowerCase(),
    intro: (item.intro || '').toLowerCase(),
    body: (item.body || '').toLowerCase(),
    url: item.url.toLowerCase(),
  },
});

export const searchContent = (
  content: SearchableContent[],
  query: string,
): Array<SearchableContent & { score: number }> => {
  const searchTerm = query.toLowerCase();
  const contentWithLower = content.map(addLowercaseFields);

  const scoredResults = contentWithLower.map(item => {
    let score = 0;

    if (item._lower.displayName === searchTerm) score += 10;
    else if (item._lower.displayName.includes(searchTerm)) score += 5;

    if (item._lower.heading === searchTerm) score += 10;
    else if (item._lower.heading.includes(searchTerm)) score += 5;

    if (item._lower.intro.includes(searchTerm)) score += 3;
    if (item._lower.body.includes(searchTerm)) score += 2;
    if (item._lower.url.includes(searchTerm)) score += 1;

    const { _lower, ...itemWithoutLower } = item;
    return { ...itemWithoutLower, score };
  });

  return scoredResults.filter(item => item.score > 0).sort((a, b) => b.score - a.score);
};