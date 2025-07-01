import { test, expectTypeOf } from 'vitest';
import type { Infer } from './infer.js';
import { contentType } from './model/index.js';

test('infer works for non-content type', () => {
  expectTypeOf<Infer<number>>().toBeUnknown();
  expectTypeOf<Infer<string>>().toBeUnknown();
  expectTypeOf<Infer<boolean>>().toBeUnknown();
});

test('infer works for basic properties', () => {
  type ExpectedType = {
    heading: string | null;
    subtitle: string | null;
    body: { json: any; html: string } | null;
    price: number | null;
    units: number | null;
    image: { url: { default: string | null; type: string | null } } | null;
  };

  const Article = contentType({
    key: 'Article',
    baseType: '_page',
    properties: {
      heading: { type: 'string' },
      subtitle: { type: 'string' },
      body: { type: 'richText' },
      price: { type: 'float' },
      units: { type: 'integer' },
      image: { type: 'contentReference' },
    },
  });

  expectTypeOf<Infer<typeof Article>>().toExtend<ExpectedType>();
});

test('infer works for array properties', () => {
  type ExpectedType = {
    heading: string[] | null;
    subtitle: string[] | null;
    body: { html: string; json: any }[] | null;
    price: number[] | null;
    units: number[] | null;
    image: { url: { default: string | null; type: string | null } }[] | null;
  };

  const Article = contentType({
    key: 'Article',
    baseType: '_page',
    properties: {
      heading: { type: 'array', items: { type: 'string' } },
      subtitle: { type: 'array', items: { type: 'string' } },
      body: { type: 'array', items: { type: 'richText' } },
      price: { type: 'array', items: { type: 'float' } },
      units: { type: 'array', items: { type: 'integer' } },
      image: { type: 'array', items: { type: 'contentReference' } },
    },
  });

  expectTypeOf<Infer<typeof Article>>().toExtend<ExpectedType>();
});

test('infer works for component properties', () => {
  type ExpectedType = {
    hero: {
      image: { url: { default: string | null; type: string | null } } | null;
    } | null;
  };

  const Hero = contentType({
    key: 'Hero',
    baseType: '_component',
    properties: {
      image: { type: 'contentReference' },
    },
  });

  const Article = contentType({
    key: 'Article',
    baseType: '_page',
    properties: {
      hero: {
        type: 'component',
        contentType: Hero,
      },
    },
  });

  expectTypeOf<Infer<typeof Article>>().toExtend<ExpectedType>();
});
