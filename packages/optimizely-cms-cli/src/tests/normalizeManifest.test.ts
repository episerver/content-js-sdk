import { describe, test, expect } from 'vitest';
import { hashItem, hashManifest, normalizeItem } from '../utils/normalizeManifest.js';

const readOnly = {
  source: 'api',
  created: '2026-11-01T10:00:00Z',
  createdBy: 'client-id',
  lastModified: '2026-11-19T10:00:00Z',
  lastModifiedBy: 'someone@example.com',
};

const propertyDefaults = {
  isLocalized: false,
  isRequired: false,
  group: 'Content',
  sortOrder: 0,
  allowedTypes: [],
  restrictedTypes: [],
};

// shaped like the Tile type in samples/nextjs-template
const localTile = {
  key: 'Tile',
  displayName: 'Tile',
  baseType: '_component',
  mayContainTypes: ['*'],
  properties: {
    title: { type: 'string', displayName: 'Title' },
    description: { type: 'richText' },
  },
};

const serverTile = {
  ...readOnly,
  isContract: false,
  sortOrder: 0,
  mediaFileExtensions: [],
  compositionBehaviors: [],
  contracts: [],
  properties: {
    description: { ...propertyDefaults, type: 'richText', editorSettings: { preset: 'expanded' } },
    title: { ...propertyDefaults, displayName: 'Title', type: 'string' },
  },
  mayContainTypes: ['*'],
  baseType: '_component',
  displayName: 'Tile',
  key: 'Tile',
};

describe('normalizeItem', () => {
  test('brings a local content type and its server copy to the same shape', () => {
    expect(normalizeItem('contentTypes', serverTile)).toEqual(
      normalizeItem('contentTypes', localTile),
    );
  });

  test('removes read-only fields', () => {
    expect(normalizeItem('propertyGroups', { key: 'seo', sortOrder: 1, ...readOnly })).toEqual({
      key: 'seo',
      sortOrder: 1,
    });
  });

  test('removes null fields', () => {
    expect(normalizeItem('contentTypes', { key: 'Seo', isContract: true, baseType: null })).toEqual({
      key: 'Seo',
      isContract: true,
    });
  });

  test('sorts keys at every level', () => {
    const normalized = normalizeItem('contentTypes', {
      key: 'Hero',
      baseType: '_component',
      properties: { title: { type: 'string', maxLength: 10 } },
    });

    expect(JSON.stringify(normalized)).toBe(
      '{"baseType":"_component","key":"Hero","properties":{"title":{"maxLength":10,"type":"string"}}}',
    );
  });

  test('keeps values that differ from the default', () => {
    const property = { type: 'string', isRequired: true, group: 'seo', sortOrder: 2 };

    expect(normalizeItem('contentTypes', { key: 'Hero', properties: { title: property } })).toEqual({
      key: 'Hero',
      properties: { title: property },
    });
  });

  test('treats ["*"] as the default mayContainTypes of contracts only', () => {
    const contract = { key: 'Seo', isContract: true, mayContainTypes: ['*'] };
    const contentType = { key: 'Hero', mayContainTypes: ['*'] };

    expect(normalizeItem('contentTypes', contract)).toEqual({ key: 'Seo', isContract: true });
    expect(normalizeItem('contentTypes', contentType)).toEqual(contentType);
  });

  test('treats the expanded editor preset as the rich text default only', () => {
    const properties = {
      body: { type: 'richText', editorSettings: { preset: 'expanded' } },
      summary: { type: 'richText', editorSettings: { preset: 'minimal' } },
      other: { type: 'string', editorSettings: { preset: 'expanded' } },
    };

    expect(normalizeItem('contentTypes', { key: 'Article', properties }).properties).toEqual({
      body: { type: 'richText' },
      other: { type: 'string', editorSettings: { preset: 'expanded' } },
      summary: { type: 'richText', editorSettings: { preset: 'minimal' } },
    });
  });

  test('removes defaults from array items', () => {
    const list = {
      type: 'array',
      items: { type: 'content', allowedTypes: [], restrictedTypes: ['Hero'] },
    };

    expect(normalizeItem('contentTypes', { key: 'Page', properties: { list } }).properties).toEqual({
      list: { type: 'array', items: { type: 'content', restrictedTypes: ['Hero'] } },
    });
  });

  test('removes display template defaults', () => {
    expect(
      normalizeItem('displayTemplates', {
        key: 'TileRow',
        nodeType: 'row',
        isDefault: false,
        settings: {},
        ...readOnly,
      }),
    ).toEqual({ key: 'TileRow', nodeType: 'row' });
  });
});

describe('hashItem', () => {
  test('hashes a local item and its server copy equally', () => {
    expect(hashItem('contentTypes', serverTile)).toBe(hashItem('contentTypes', localTile));
  });

  test('changes when a value changes', () => {
    const edited = { ...localTile, displayName: 'Tile (teammate)' };

    expect(hashItem('contentTypes', edited)).not.toBe(hashItem('contentTypes', localTile));
  });

  test('hashes every item of a manifest by section and key', () => {
    const hashes = hashManifest({
      contentTypes: [localTile],
      displayTemplates: null,
      propertyGroups: [{ key: 'seo', displayName: 'SEO', sortOrder: 1 }],
    });

    expect(hashes).toEqual({
      'contentTypes:Tile': hashItem('contentTypes', localTile),
      'propertyGroups:seo': hashItem('propertyGroups', {
        key: 'seo',
        displayName: 'SEO',
        sortOrder: 1,
      }),
    });
  });

  test('keeps array order significant', () => {
    const allowed = (allowedTypes: string[]) => ({
      key: 'Page',
      properties: { link: { type: 'contentReference', allowedTypes } },
    });

    expect(hashItem('contentTypes', allowed(['_page', '_image']))).not.toBe(
      hashItem('contentTypes', allowed(['_image', '_page'])),
    );
  });
});
