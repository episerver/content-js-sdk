import { describe, expect, test, beforeEach } from 'vitest';
import { createSingleContentQuery, createMultipleContentQuery } from '../createQuery.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';

const PageType = contentType({
  key: 'TestPage',
  displayName: 'Test Page',
  baseType: '_page',
  properties: {
    title: { type: 'string' },
  },
});

beforeEach(() => {
  initContentTypeRegistry([PageType]);
  refreshCache();
});

describe('createSingleContentQuery with taxonomy', () => {
  test('includes categories in ItemMetadata when taxonomyEnabled is true', () => {
    const query = createSingleContentQuery('TestPage', { taxonomyEnabled: true });

    const itemMetadataMatch = query.match(/fragment ItemMetadata on ItemMetadata \{([^}]+)\}/);
    expect(itemMetadataMatch).not.toBeNull();
    expect(itemMetadataMatch![1]).toContain('categories');
  });

  test('excludes categories from ItemMetadata when taxonomyEnabled is false', () => {
    const query = createSingleContentQuery('TestPage', { taxonomyEnabled: false });

    const itemMetadataMatch = query.match(/fragment ItemMetadata on ItemMetadata \{([^}]+)\}/);
    expect(itemMetadataMatch).not.toBeNull();
    expect(itemMetadataMatch![1]).not.toContain('categories');
  });

  test('excludes categories by default (taxonomyEnabled defaults to false)', () => {
    const query = createSingleContentQuery('TestPage');

    const itemMetadataMatch = query.match(/fragment ItemMetadata on ItemMetadata \{([^}]+)\}/);
    expect(itemMetadataMatch).not.toBeNull();
    expect(itemMetadataMatch![1]).not.toContain('categories');
  });
});

describe('createMultipleContentQuery with taxonomy', () => {
  test('includes categories in ItemMetadata when taxonomyEnabled is true', () => {
    const query = createMultipleContentQuery('TestPage', { taxonomyEnabled: true });

    const itemMetadataMatch = query.match(/fragment ItemMetadata on ItemMetadata \{([^}]+)\}/);
    expect(itemMetadataMatch).not.toBeNull();
    expect(itemMetadataMatch![1]).toContain('categories');
  });

  test('excludes categories from ItemMetadata when taxonomyEnabled is false', () => {
    const query = createMultipleContentQuery('TestPage', { taxonomyEnabled: false });

    const itemMetadataMatch = query.match(/fragment ItemMetadata on ItemMetadata \{([^}]+)\}/);
    expect(itemMetadataMatch).not.toBeNull();
    expect(itemMetadataMatch![1]).not.toContain('categories');
  });
});

describe('cache key differentiation', () => {
  test('generates different queries for different taxonomyEnabled values', () => {
    const withTaxonomy = createSingleContentQuery('TestPage', { taxonomyEnabled: true });
    const withoutTaxonomy = createSingleContentQuery('TestPage', { taxonomyEnabled: false });

    expect(withTaxonomy).not.toEqual(withoutTaxonomy);
    expect(withTaxonomy).toContain('categories');
    expect(withoutTaxonomy).not.toContain('categories');
  });
});
