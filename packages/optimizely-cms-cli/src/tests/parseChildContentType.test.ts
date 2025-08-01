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
