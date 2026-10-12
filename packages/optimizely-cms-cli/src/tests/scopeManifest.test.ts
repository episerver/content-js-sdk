import { describe, it, expect } from 'vitest';
import { findUnknownKeys, parseOnlyKeys, scopeManifest } from '../utils/scopeManifest.js';

const manifest: Parameters<typeof scopeManifest>[0] = {
  contentTypes: [
    {
      key: 'Hero',
      properties: {
        title: { type: 'string', group: 'content' },
        image: { type: 'contentReference', group: 'media' },
      },
    },
    {
      key: 'LandingPage',
      properties: {
        heading: { type: 'string', group: 'content' },
        metaTitle: { type: 'string', group: 'seo' },
      },
    },
    {
      key: 'SeoContract',
      isContract: true,
      properties: { keywords: { type: 'string' } },
    },
    { key: 'Empty' },
  ],
  displayTemplates: [
    { key: 'HeroDefault', contentType: 'Hero' },
    { key: 'HeroWide', contentType: 'Hero' },
    { key: 'LandingDefault', contentType: 'LandingPage' },
    { key: 'AnyComponent', baseType: '_component' },
    { key: 'RowTemplate', nodeType: 'row' },
  ],
  propertyGroups: [
    { key: 'content', displayName: 'Content' },
    { key: 'media', displayName: 'Media' },
    { key: 'seo', displayName: 'SEO' },
  ],
};

const keysOf = (items: { key: string }[]) => items.map(it => it.key);

describe('parseOnlyKeys', () => {
  it('returns undefined when the flag is not passed', () => {
    expect(parseOnlyKeys(undefined)).toBeUndefined();
  });

  it('splits comma-separated keys', () => {
    expect(parseOnlyKeys('Hero,LandingPage')).toEqual(['Hero', 'LandingPage']);
  });

  it('trims whitespace around keys', () => {
    expect(parseOnlyKeys(' Hero , LandingPage ')).toEqual(['Hero', 'LandingPage']);
  });

  it('drops empty entries', () => {
    expect(parseOnlyKeys('Hero,,LandingPage,')).toEqual(['Hero', 'LandingPage']);
  });

  it('returns an empty list when no key is given', () => {
    expect(parseOnlyKeys('')).toEqual([]);
    expect(parseOnlyKeys(' , ')).toEqual([]);
  });
});

describe('scopeManifest', () => {
  it('keeps only the selected content type, its display templates and its property groups', () => {
    const scoped = scopeManifest(manifest, ['Hero']);

    expect(keysOf(scoped.contentTypes)).toEqual(['Hero']);
    expect(keysOf(scoped.displayTemplates)).toEqual(['HeroDefault', 'HeroWide']);
    expect(keysOf(scoped.propertyGroups)).toEqual(['content', 'media']);
  });

  it('combines several keys without duplicating shared property groups', () => {
    const scoped = scopeManifest(manifest, ['Hero', 'LandingPage']);

    expect(keysOf(scoped.contentTypes)).toEqual(['Hero', 'LandingPage']);
    expect(keysOf(scoped.displayTemplates)).toEqual([
      'HeroDefault',
      'HeroWide',
      'LandingDefault',
    ]);
    expect(keysOf(scoped.propertyGroups)).toEqual(['content', 'media', 'seo']);
  });

  it('includes contracts by key', () => {
    const scoped = scopeManifest(manifest, ['SeoContract']);

    expect(keysOf(scoped.contentTypes)).toEqual(['SeoContract']);
    expect(scoped.displayTemplates).toEqual([]);
    expect(scoped.propertyGroups).toEqual([]);
  });

  it('includes base type and node display templates only when selected by key', () => {
    const scoped = scopeManifest(manifest, ['AnyComponent', 'RowTemplate']);

    expect(scoped.contentTypes).toEqual([]);
    expect(keysOf(scoped.displayTemplates)).toEqual(['AnyComponent', 'RowTemplate']);
    expect(scoped.propertyGroups).toEqual([]);
  });

  it('selects a single display template without its content type', () => {
    const scoped = scopeManifest(manifest, ['HeroWide']);

    expect(scoped.contentTypes).toEqual([]);
    expect(keysOf(scoped.displayTemplates)).toEqual(['HeroWide']);
  });

  it('handles content types without properties', () => {
    const scoped = scopeManifest(manifest, ['Empty']);

    expect(keysOf(scoped.contentTypes)).toEqual(['Empty']);
    expect(scoped.propertyGroups).toEqual([]);
  });

  it('does not mutate the original manifest', () => {
    const snapshot = structuredClone(manifest);

    scopeManifest(manifest, ['Hero']);

    expect(manifest).toEqual(snapshot);
  });
});

describe('findUnknownKeys', () => {
  it('returns an empty list when every key exists', () => {
    expect(findUnknownKeys(manifest, ['Hero', 'SeoContract', 'AnyComponent'])).toEqual(
      [],
    );
  });

  it('returns the keys that match nothing', () => {
    expect(findUnknownKeys(manifest, ['Hero', 'Heroo', 'content'])).toEqual([
      'Heroo',
      'content',
    ]);
  });
});
