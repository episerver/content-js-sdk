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
});
