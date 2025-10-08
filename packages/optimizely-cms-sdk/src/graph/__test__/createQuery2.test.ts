import { describe, expect, test } from 'vitest';
import { createFragment } from '../createQuery.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';

describe('createFragment() simple cases', () => {
  test('works for scalar properties', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        str: { type: 'string' },
        bin: { type: 'binary' },
        boo: { type: 'boolean' },
        flo: { type: 'float' },
        int: { type: 'integer' },
        dat: { type: 'dateTime' },
      },
    });
    initContentTypeRegistry([ct1]);

    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment ct1 on ct1 { __typename str bin boo flo int dat }",
      ]
    `);
  });

  test('works for arrays of scalar properties', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        str: { type: 'array', items: { type: 'string' } },
        bin: { type: 'array', items: { type: 'binary' } },
        boo: { type: 'array', items: { type: 'boolean' } },
        flo: { type: 'array', items: { type: 'float' } },
        int: { type: 'array', items: { type: 'integer' } },
        dat: { type: 'array', items: { type: 'dateTime' } },
      },
    });
    initContentTypeRegistry([ct1]);

    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment ct1 on ct1 { __typename str bin boo flo int dat }",
      ]
    `);
  });

  test('works for compound properties', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        lin: { type: 'link' },
        ric: { type: 'richText' },
        lin2: { type: 'array', items: { type: 'link' } },
        ric2: { type: 'array', items: { type: 'richText' } },
      },
    });
    initContentTypeRegistry([ct1]);

    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment ct1 on ct1 { __typename lin { url { type, default }} ric { html, json } lin2 { url { type, default }} ric2 { html, json } }",
      ]
    `);
  });
});

// describe(
//   'createFragment() with combinations of `allowedTypes` and `restrictedTypes`'
// );

describe('createFragment() edge cases', () => {
  test('correct syntax when referring to an empty set', async () => {
    // In this test, there is one content type "ct1" that has a `content` property, with allowed types = "_component"
    // But there is no content type with base type '_component'.
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        p1: { type: 'content', allowedTypes: ['_component'] },
      },
    });
    initContentTypeRegistry([ct1]);
    const result = await createFragment('ct1');

    // Make sure that the query is correct. The `p1 {}` part should have something between the curly braces
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment ct1 on ct1 { __typename p1 { __typename } }",
      ]
    `);
  });
});
