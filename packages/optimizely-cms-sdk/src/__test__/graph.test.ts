import { describe, expect, test } from 'vitest';
import { createQuery, parseResponseProperty } from '../graph';
import { contentType } from '../model';
import { AnyProperty } from '../model/contentTypeProperties';

const ct1 = contentType({
  key: 'ct1',
  baseType: 'page',
  properties: {
    p1: { type: 'string' },
    p2: { type: 'boolean' },
  },
});

const ct2 = contentType({
  key: 'ct2',
  baseType: 'page',
  properties: {
    p1: { type: 'richText' },
    p2: { type: 'link' },
    p3: { type: 'url' },
    p4: { type: 'array', items: { type: 'string' } },
  },
});

const ct3 = contentType({
  key: 'ct3',
  baseType: 'page',
  properties: {
    p1: {
      type: 'content',
      // allowedTypes: ['...'],
      // restrictedTypes: ['...'],
      views: [ct1],
    },
  },
});

describe('createQuery', () => {
  test('properties that match 1:1', () => {
    expect(createQuery(ct1)).toMatchInlineSnapshot(`
      "
      fragment ct1 on ct1 { p1 p2 }
      query FetchContent($filter: _ContentWhereInput) {
        _Content(where: $filter) {
          item {
            ...ct1
          }
        }
      }
        "
    `);
  });

  test('properties that add extra information in Graph', () => {
    expect(createQuery(ct2)).toMatchInlineSnapshot(`
      "
      fragment ct2 on ct2 { p1 { html, json } p2 { url { type, default }} p3 { type, default } p4 }
      query FetchContent($filter: _ContentWhereInput) {
        _Content(where: $filter) {
          item {
            ...ct2
          }
        }
      }
        "
    `);
  });

  test("'content' properties", () => {
    expect(createQuery(ct3)).toMatchInlineSnapshot(`
      "
      fragment ct1 on ct1 { p1 p2 }
      fragment ct3 on ct3 { p1 { ...ct1 } }
      query FetchContent($filter: _ContentWhereInput) {
        _Content(where: $filter) {
          item {
            ...ct3
          }
        }
      }
        "
    `);
  });
});

describe('parseResponseProperty', () => {
  test("properties that don't add extra information", () => {
    const p1: AnyProperty = {
      type: 'string',
    };
    expect(parseResponseProperty(p1, 'hello')).toEqual('hello');
  });

  test('array properties', () => {
    const p1: AnyProperty = {
      type: 'array',
      items: {
        type: 'string',
      },
    };

    expect(parseResponseProperty(p1, ['hello'])).toEqual(['hello']);
  });

  const ct4 = contentType({
    key: 'contenttype4',
    baseType: 'component',
    properties: {
      p1: { type: 'string' },
      p2: { type: 'boolean' },
    },
  });
  const p1: AnyProperty = {
    type: 'content',
    views: [ct4],
  };
  test('content properties', () => {
    expect(
      parseResponseProperty(p1, {
        __typename: 'contenttype4',
        p1: 'hi',
        p2: true,
      })
    ).toEqual({
      __viewname: 'contenttype4',
      __typename: 'contenttype4',
      p1: 'hi',
      p2: true,
    });
  });

  test('content properties resolve to null if view is not found', () => {
    expect(
      parseResponseProperty(p1, {
        __typename: 'unknown_content_type',
        p1: 'hi',
        p2: true,
      })
    ).toEqual(null);
  });
});
