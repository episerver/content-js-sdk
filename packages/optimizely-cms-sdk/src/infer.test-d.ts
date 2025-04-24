import { test, expectTypeOf } from 'vitest';
import type { Infer } from './infer.js';
import { contentType } from './model/index.js';

test('infer works for non-content type', () => {
  expectTypeOf<Infer<number>>().toBeUnknown();
  expectTypeOf<Infer<string>>().toBeUnknown();
  expectTypeOf<Infer<boolean>>().toBeUnknown();
});

test('infer works for basic content types', () => {
  type ExpectedType = {
    heading: string;
    subtitle: string;
    body: { html: string; json: any };
    price: number;
    units: number;
    links: string[];
  };

  const Article = contentType({
    key: 'Article',
    baseType: 'page',
    properties: {
      heading: { type: 'string' },
      subtitle: { type: 'string' },
      body: { type: 'richText' },
      price: { type: 'float' },
      units: { type: 'integer' },
      links: { type: 'array', items: { type: 'string' } },
    },
  });

  expectTypeOf<Infer<typeof Article>>().toMatchObjectType<ExpectedType>();
});
