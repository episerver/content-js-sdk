import { describe, it, test, expect } from 'vitest';
import { normalizeMayContainTypes } from '../utils/mapping.js';
import { contentType } from '@optimizely/cms-sdk';

describe('normalizeMayContainTypes', () => {
  it('should parse a content type with mayContainTypes', () => {
    const child1 = contentType({
      key: 'child1',
      displayName: 'Child 1',
      baseType: '_component',
    });
    const child2 = contentType({
      key: 'child2',
      displayName: 'Child 2',
      baseType: '_component',
    });
    const input = contentType({
      key: 'example',
      displayName: 'Example',
      baseType: '_component',
      mayContainTypes: [child1, child2],
    });

    expect(normalizeMayContainTypes(input)).toMatchObject({
      key: 'example',
      displayName: 'Example',
      baseType: '_component',
      mayContainTypes: ['child1', 'child2'],
    });
  });

  it('should handle content types that self-reference mayContainTypes', () => {
    const input = contentType({
      key: 'example',
      displayName: 'Example',
      baseType: '_component',
      mayContainTypes: ['_self'],
    });

    expect(normalizeMayContainTypes(input).mayContainTypes).toEqual(['example']);
  });

  test.each(['_page', '_experience', '_folder', '_component'])(
    'defaults mayContainTypes to ["*"] for a %s without mayContainTypes',
    baseType => {
      expect(normalizeMayContainTypes({ key: 'example', baseType })).toEqual({
        key: 'example',
        baseType,
        mayContainTypes: ['*'],
      });
    },
  );

  it('should not add mayContainTypes for non-container types', () => {
    const input = contentType({
      key: 'example',
      displayName: 'Example',
      baseType: '_section',
    } as any);

    const result = normalizeMayContainTypes(input);

    expect(result).toMatchObject({ key: 'example', baseType: '_section' });
    expect(result).not.toHaveProperty('mayContainTypes');
  });

  test('skips validation for the * wildcard and _-prefixed base types', () => {
    const result = normalizeMayContainTypes(
      { key: 'Blog', mayContainTypes: ['*', '_page', '_image'] },
      new Set(),
    );

    expect(result.mayContainTypes).toEqual(['*', '_page', '_image']);
  });

  test('accepts string keys that are known content types', () => {
    const result = normalizeMayContainTypes(
      { key: 'Blog', mayContainTypes: [' Article ', 'Gallery'] },
      new Set(['Article', 'Gallery']),
    );

    expect(result.mayContainTypes).toEqual(['Article', 'Gallery']);
  });
});

describe('normalizeMayContainTypes errors', () => {
  it('throws on duplicate entries in mayContainTypes', () => {
    const contentType = {
      key: 'Blog',
      mayContainTypes: ['Article', 'Article', 'Gallery'],
    };
    const allowedKeys = new Set(['Article', 'Gallery']);

    expect(() => normalizeMayContainTypes(contentType, allowedKeys)).toThrow(
      '❌ [optimizely-cms-cli] Duplicate entries in mayContainTypes for content type "Blog": Article',
    );
  });

  it('throws on unknown entries, underscore keys allowed', () => {
    const contentType = {
      key: 'Blog',
      mayContainTypes: ['_page', 'Valid', 'Unknown'],
    };
    const allowedKeys = new Set(['Valid']);

    expect(() => normalizeMayContainTypes(contentType, allowedKeys)).toThrow(
      '❌ [optimizely-cms-cli] Invalid mayContainTypes for content type "Blog". Unknown content types: Unknown',
    );
  });
});
