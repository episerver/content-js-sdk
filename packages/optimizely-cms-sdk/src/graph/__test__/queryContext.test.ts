import { describe, expect, test } from 'vitest';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';
import { BlogArticle, Categorizable, NewsArticle, fragmentsFor } from './helpers.js';

/**
 * Settings in `QueryContext` are fixed for a whole query, so they have to reach
 * every level of the recursion. Each level used to rebuild the options object
 * by hand and re-list a subset, which silently dropped whatever the author
 * forgot — array properties honoured neither `expandContracts` nor `typeFilter`
 * because of it, and a dropped `formsEnabled` produced two conflicting
 * definitions of `ICompositionNode` and a rejected query.
 */

/** Builds a page whose single property has the given shape, and returns its fragments. */
function pageFragmentsFor(
  property: unknown,
  context: Parameters<typeof fragmentsFor>[1],
): string {
  const Page = contentType({
    key: 'ContextPage',
    displayName: 'Context Page',
    baseType: '_page',
    properties: { field: property as never },
  });

  initContentTypeRegistry([Categorizable, BlogArticle, NewsArticle, Page]);
  refreshCache();

  return fragmentsFor('ContextPage', context).join('\n');
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
    const collapsed = pageFragmentsFor(property, { expandContracts: false });
    const expanded = pageFragmentsFor(property, { expandContracts: true });

    expect(collapsed).not.toContain('fragment BlogArticle');
    expect(expanded).toContain('fragment BlogArticle');
    expect(expanded).toContain('fragment NewsArticle');
    expect(expanded).toMatch(
      /ContextPage__field:field \{[^}]*\.\.\.Categorizable[^}]*\.\.\.BlogArticle[^}]*\.\.\.NewsArticle/,
    );
  });

  test('honours typeFilter', () => {
    const everything = pageFragmentsFor(property, { expandContracts: true });
    const filtered = pageFragmentsFor(property, {
      expandContracts: true,
      typeFilter: key => key !== 'NewsArticle',
    });

    expect(everything).toContain('fragment NewsArticle');
    expect(filtered).not.toContain('fragment NewsArticle');
    expect(filtered).toContain('fragment BlogArticle');
  });
});
