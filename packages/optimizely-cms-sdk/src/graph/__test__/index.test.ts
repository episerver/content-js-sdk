import { describe, expect, test } from 'vitest';
import { createQuery, parseResponse, parseResponseProperty } from '..';
import { contentType } from '../../model';

const ct1 = contentType({
  key: 'ct1',
  baseType: 'component',
  properties: {
    p1: { type: 'string' },
    p2: { type: 'boolean' },
  },
});

const ct2 = contentType({
  key: 'ct2',
  baseType: 'component',
  properties: {
    p1: { type: 'richText' },
    p2: { type: 'link' },
    p3: { type: 'url' },
    p4: { type: 'array', items: { type: 'string' } },
  },
});

const ct3 = contentType({
  key: 'ct3',
  baseType: 'component',
  properties: {
    p1: {
      type: 'content',
      views: [ct1],
    },
  },
});

const ct4 = contentType({
  key: 'ct4',
  baseType: 'component',
  properties: {
    p1: {
      type: 'array',
      items: {
        type: 'content',
        views: [ct1],
      },
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
      fragment ct3 on ct3 { p1 { __typename ...ct1 } }
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

describe('parseResponse', () => {
  test('parses simple properties correctly', () => {
    const response = { p1: 'hello', p2: true };
    expect(parseResponse(ct1, response)).toEqual(response);
  });

  test('returns excess properties', () => {
    const response = { p1: 'hello', p2: true, metadata: 12345 };
    expect(parseResponse(ct1, response)).toEqual(response);
  });

  test('handles content properties', () => {
    const response = {
      p1: {
        __typename: 'ct1',
        p1: 'hello',
        p2: true,
      },
    };

    expect(parseResponse(ct3, response)).toEqual({
      p1: {
        __typename: 'ct1',
        __viewname: 'ct1',
        p1: 'hello',
        p2: true,
      },
    });
  });

  test('resolve to null if content type is not found', () => {
    const response = {
      p1: {
        // `ct2` is not an acceptable "view" for ct3.p1
        __typename: 'ct2',
        p1: 'hello',
        p2: true,
      },
    };

    expect(parseResponse(ct3, response)).toEqual({ p1: null });
  });

  test('handles arrays of content', () => {
    const response = {
      p1: [
        { __typename: 'ct1', p1: 'hello', p2: true },
        { __typename: 'ct1', p1: 'world', p2: false },
      ],
    };

    expect(parseResponse(ct4, response)).toMatchInlineSnapshot(`
      {
        "p1": [
          {
            "__typename": "ct1",
            "__viewname": "ct1",
            "p1": "hello",
            "p2": true,
          },
          {
            "__typename": "ct1",
            "__viewname": "ct1",
            "p1": "world",
            "p2": false,
          },
        ],
      }
    `);
  });
});
