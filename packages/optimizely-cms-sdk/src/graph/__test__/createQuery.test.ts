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

  test('correct syntax with content types without properties', async () => {
    const ct1 = contentType({ key: 'ct1', baseType: '_page' });
    initContentTypeRegistry([ct1]);

    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment ct1 on ct1 { __typename }",
      ]
    `);
  });
});

describe('createFragment() with `content` properties. Explicit reference via `allowedTypes`', () => {
  test('one level', async () => {
    const r1 = contentType({ key: 'r1', baseType: '_component' });
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: { p1: { type: 'content', allowedTypes: [r1] } },
    });
    initContentTypeRegistry([r1, ct1]);
    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename }",
        "fragment ct1 on ct1 { __typename p1 { __typename ...r1 } }",
      ]
    `);
  });

  test('two levels', async () => {
    const r1 = contentType({ key: 'r1', baseType: '_component' });
    const r2 = contentType({
      key: 'r2',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: [r1] } },
    });
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: { p1: { type: 'content', allowedTypes: [r2] } },
    });
    initContentTypeRegistry([r1, r2, ct1]);
    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename }",
        "fragment r2 on r2 { __typename p1 { __typename ...r1 } }",
        "fragment ct1 on ct1 { __typename p1 { __typename ...r2 } }",
      ]
    `);
  });

  test('repeated reference', async () => {
    const r1 = contentType({ key: 'r1', baseType: '_component' });
    const ct1 = contentType({
      key: 'r2',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: [r1] } },
    });
    const ct2 = contentType({
      key: 'ct2',
      baseType: '_page',
      properties: {
        p1: { type: 'content', allowedTypes: [r1] },
        pct1: { type: 'content', allowedTypes: [ct1] },
      },
    });
    initContentTypeRegistry([r1, ct1, ct2]);
    const result = await createFragment('ct2');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename }",
        "fragment r2 on r2 { __typename p1 { __typename ...r1 } }",
        "fragment ct2 on ct2 { __typename p1 { __typename ...r1 } pct1 { __typename ...r2 } }",
      ]
    `);
  });
});

describe('createFragment() with `content` properties. Base types', () => {
  test('one level', async () => {
    const r1 = contentType({ key: 'r1', baseType: '_component' });
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: { p1: { type: 'content', allowedTypes: ['_component'] } },
    });
    initContentTypeRegistry([r1, ct1]);
    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename }",
        "fragment ct1 on ct1 { __typename p1 { __typename ...r1 } }",
      ]
    `);
  });

  test('two levels', async () => {
    const r1 = contentType({ key: 'r1', baseType: '_component' });
    const r2 = contentType({
      key: 'r2',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: ['_component'] } },
    });
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: { p1: { type: 'content', allowedTypes: ['_component'] } },
    });
    initContentTypeRegistry([r1, r2, ct1]);
    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename }",
        "fragment r2 on r2 { __typename p1 { __typename ...r1 ...r2 } }",
        "fragment ct1 on ct1 { __typename p1 { __typename ...r1 ...r2 } }",
      ]
    `);
  });

  test('resolve correctly when `allowedTypes` is a base type', async () => {
    const r1 = contentType({ key: 'r1', baseType: '_component' });
    const r2 = contentType({ key: 'r2', baseType: '_component' });
    const r3 = contentType({ key: 'r3', baseType: '_component' });
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        p1: {
          type: 'content',
          allowedTypes: ['_component'],
        },
      },
    });

    initContentTypeRegistry([r1, r2, r3, ct1]);
    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename }",
        "fragment r2 on r2 { __typename }",
        "fragment r3 on r3 { __typename }",
        "fragment ct1 on ct1 { __typename p1 { __typename ...r1 ...r2 ...r3 } }",
      ]
    `);
  });

  test('repeated reference', async () => {
    const r1 = contentType({ key: 'r1', baseType: '_component' });
    const r2 = contentType({
      key: 'r2',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: [r1] } },
    });
    const ct2 = contentType({
      key: 'ct2',
      baseType: '_page',
      properties: {
        p1: { type: 'content', allowedTypes: [r1] },
        p2: { type: 'content', allowedTypes: ['_component'] },
      },
    });
    initContentTypeRegistry([r1, r2, ct2]);
    const result = await createFragment('ct2');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename }",
        "fragment r2 on r2 { __typename p1 { __typename ...r1 } }",
        "fragment ct2 on ct2 { __typename p1 { __typename ...r1 } p2 { __typename ...r1 ...r2 } }",
      ]
    `);
  });
});

describe('createFragment() with `content` properties. Allowed and restricted types', () => {
  test('only restricted', async () => {
    const r1 = contentType({ key: 'r1', baseType: '_component' });
    const r2 = contentType({ key: 'r2', baseType: '_component' });
    const r3 = contentType({ key: 'r3', baseType: '_component' });
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        p1: {
          type: 'content',
          restrictedTypes: [r2],
        },
      },
    });

    initContentTypeRegistry([r1, r2, r3, ct1]);
    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename }",
        "fragment r3 on r3 { __typename }",
        "fragment ct1 on ct1 { __typename p1 { __typename ...r1 ...r3 ...ct1 } }",
      ]
    `);
  });

  test('allowed and restricted', async () => {
    const r1 = contentType({ key: 'r1', baseType: '_component' });
    const r2 = contentType({ key: 'r2', baseType: '_component' });
    const r3 = contentType({ key: 'r3', baseType: '_component' });
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        p1: {
          type: 'content',
          allowedTypes: ['_component'],
          restrictedTypes: [r2],
        },
      },
    });

    initContentTypeRegistry([r1, r2, r3, ct1]);
    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename }",
        "fragment r3 on r3 { __typename }",
        "fragment ct1 on ct1 { __typename p1 { __typename ...r1 ...r3 } }",
      ]
    `);
  });
});

describe('createFragment() with self references', () => {
  test('explicit self-reference', async () => {
    const r1 = contentType({
      key: 'r1',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: ['_self'] } },
    });

    initContentTypeRegistry([r1]);
    const result = await createFragment('r1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename p1 { __typename ...r1 } }",
      ]
    `);
  });

  test('without any limitations', async () => {
    const r1 = contentType({
      key: 'r1',
      baseType: '_component',
      properties: { p1: { type: 'content' } },
    });

    initContentTypeRegistry([r1]);
    const result = await createFragment('r1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename p1 { __typename ...r1 } }",
      ]
    `);
  });

  test('with allowed (its own base type)', async () => {
    const r1 = contentType({
      key: 'r1',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: ['_component'] } },
    });

    initContentTypeRegistry([r1]);
    const result = await createFragment('r1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename p1 { __typename ...r1 } }",
      ]
    `);
  });

  test('with allowed (its own base type)', async () => {
    const r2 = contentType({ key: 'r2', baseType: '_component' });
    const r1 = contentType({
      key: 'r1',
      baseType: '_component',
      properties: {
        p1: {
          type: 'content',
          allowedTypes: ['_component'],
          restrictedTypes: [r2],
        },
      },
    });

    initContentTypeRegistry([r1]);
    const result = await createFragment('r1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment r1 on r1 { __typename p1 { __typename ...r1 } }",
      ]
    `);
  });
});

describe('createFragment() empty objects', () => {
  test('properties with indexType', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        p1: { type: 'string', indexingType: 'disabled' },
        p2: { type: 'string', indexingType: 'queryable' },
        p3: { type: 'string', indexingType: 'searchable' },
      },
    });
    initContentTypeRegistry([ct1]);
    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment ct1 on ct1 { __typename p2 p3 }",
      ]
    `);
  });

  test('only with disabled indexType', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        p1: { type: 'string', indexingType: 'disabled' },
        p2: { type: 'string', indexingType: 'disabled' },
      },
    });
    initContentTypeRegistry([ct1]);
    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment ct1 on ct1 { __typename }",
      ]
    `);
  });

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
