import { expect, test } from 'vitest';
import { createQuery } from '../graph';
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

test('Create queries for basic content types', () => {
  expect(createQuery(ct1)).toMatchInlineSnapshot(`
    "
    fragment ct1 on ct1 { p1 p2 }
    query FetchContent($filter: _ContentWhereInput) {
      __Content(where: $filter) {
        ...ct1
      }
    }
      "
  `);

  expect(createQuery(ct2)).toMatchInlineSnapshot(`
    "
    fragment ct2 on ct2 { p1 { html, json } p2 { url { type, default }} p3 { type, default } p4 }
    query FetchContent($filter: _ContentWhereInput) {
      __Content(where: $filter) {
        ...ct2
      }
    }
      "
  `);
});
