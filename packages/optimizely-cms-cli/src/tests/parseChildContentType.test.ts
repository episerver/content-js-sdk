import { describe, it, expect } from 'vitest';
import { parseChildContentType } from '../utils/mapping.js';
import { contentType } from '@episerver/cms-sdk';

describe('parseChildContentType', () => {
  it('should parse a content type with mayContainTypes', () => {
    const child1 = contentType({
      key: 'child1',
      baseType: '_component',
    });
    const child2 = contentType({
      key: 'child2',
      baseType: '_component',
    });
    const input = contentType({
      key: 'example',
      baseType: '_component',
      mayContainTypes: [child1, child2],
    });

    expect(parseChildContentType(input)).toMatchInlineSnapshot(`
      {
        "__type": "contentType",
        "baseType": "_component",
        "key": "example",
        "mayContainTypes": [
          "child1",
          "child2",
        ],
      }
    `);
  });

  it('should handle content types that self-reference mayContainTypes', () => {
    const input = contentType({
      key: 'example',
      baseType: '_component',
      mayContainTypes: ['_self'],
    });

    expect(parseChildContentType(input)).toMatchInlineSnapshot(`
      {
        "__type": "contentType",
        "baseType": "_component",
        "key": "example",
        "mayContainTypes": [
          "example",
        ],
      }
    `);
  });

  it('should handle content types without mayContainTypes', () => {
    const input = contentType({
      key: 'example',
      baseType: '_component',
    });

    expect(parseChildContentType(input)).toMatchInlineSnapshot(`
      {
        "__type": "contentType",
        "baseType": "_component",
        "key": "example",
      }
    `);
  });
});

describe('parseChildContentType errors', () => {
  it('throws on duplicate entries in mayContainTypes', () => {
    const contentType = {
      key: 'Blog',
      mayContainTypes: ['Article', 'Article', 'Gallery'],
    };
    const allowedKeys = new Set(['Article', 'Gallery']);

    expect(() => parseChildContentType(contentType, allowedKeys)).toThrow(
      '❌ [optimizely-cms-cli] Duplicate entries in mayContainTypes for content type "Blog": Article'
    );
  });

  it('throws on unknown entries, underscore keys allowed', () => {
    const contentType = {
      key: 'Blog',
      mayContainTypes: ['_page', 'Valid', 'Unknown'],
    };
    const allowedKeys = new Set(['Valid']);

    expect(() => parseChildContentType(contentType, allowedKeys)).toThrow(
      '❌ [optimizely-cms-cli] Invalid mayContainTypes for content type "Blog". Unknown content types: Unknown'
    );
  });
});
