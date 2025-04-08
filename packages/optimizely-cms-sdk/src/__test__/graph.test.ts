import { describe, expect, test } from 'vitest';
import { createQuery, createParser } from '../graph';
import { contentType } from '../model';

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

describe('createParser', () => {
  test("properties that don't add extra information", () => {
    const parser = createParser(ct1);
    expect(parser({ p1: 'hi', p2: true })).toMatchInlineSnapshot(`
      {
        "__viewname": "ct1",
        "p1": "hi",
        "p2": true,
      }
    `);
  });
});
