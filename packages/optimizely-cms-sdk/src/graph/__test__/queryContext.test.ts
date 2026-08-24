import { describe, expect, test } from 'vitest';
import { createFragment } from '../createQuery.js';
import { contract, contentType, initContentTypeRegistry } from '../../model/index.js';
import { createQueryContext, refreshCache } from '../../util/queryUtils.js';

/**
 * Settings in `QueryContext` are fixed for a whole query, so they have to reach
 * every level of the recursion. Each level used to rebuild the options object
 * by hand and re-list a subset, which silently dropped whatever the author
 * forgot — array properties honoured neither `expandContracts` nor `typeFilter`
 * because of it, and a dropped `formsEnabled` produced two conflicting
 * definitions of `ICompositionNode` and a rejected query.
 */

const Categorizable = contract({
  key: 'Categorizable',
  displayName: 'Categorizable',
  properties: { category: { type: 'string' } },
});

const BlogArticle = contentType({
  key: 'BlogArticle',
  displayName: 'Blog Article',
  baseType: '_page',
  extends: Categorizable,
  properties: { title: { type: 'string' } },
});

const NewsArticle = contentType({
  key: 'NewsArticle',
  displayName: 'News Article',
  baseType: '_page',
  extends: Categorizable,
  properties: { headline: { type: 'string' } },
});

/** Builds a page whose single property has the given shape, and returns its fragments. */
function fragmentsFor(
  property: unknown,
  context: Parameters<typeof createQueryContext>[0],
): string {
  const Page = contentType({
    key: 'ContextPage',
    displayName: 'Context Page',
    baseType: '_page',
    properties: { field: property as never },
  });

  initContentTypeRegistry([Categorizable, BlogArticle, NewsArticle, Page]);
  refreshCache();

  return createFragment(
    'ContextPage',
    new Set(),
    '',
    createQueryContext({ maxFragmentThreshold: 100, ...context }),
  ).fragments.join('\n');
}

const shapes = {
  'a content property': { type: 'content', allowedTypes: [Categorizable] },
  'an array of content': {
    type: 'array',
    items: { type: 'content', allowedTypes: [Categorizable] },
  },
};

describe.each(Object.entries(shapes))('%s', (_label, property) => {
  test('honours expandContracts', () => {
    const collapsed = fragmentsFor(property, { expandContracts: false });
    const expanded = fragmentsFor(property, { expandContracts: true });

    expect(collapsed).not.toContain('fragment BlogArticle');
    expect(expanded).toContain('fragment BlogArticle');
    expect(expanded).toContain('fragment NewsArticle');
  });

  test('honours typeFilter', () => {
    const everything = fragmentsFor(property, { expandContracts: true });
    const filtered = fragmentsFor(property, {
      expandContracts: true,
      typeFilter: key => key !== 'NewsArticle',
    });

    expect(everything).toContain('fragment NewsArticle');
    expect(filtered).not.toContain('fragment NewsArticle');
    expect(filtered).toContain('fragment BlogArticle');
  });
});
