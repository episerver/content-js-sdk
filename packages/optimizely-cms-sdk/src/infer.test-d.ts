import { test, expectTypeOf } from 'vitest';
import type { ContentProps } from './infer.js';
import { contentType } from './model/index.js';

test('ContentProps works for non-content type', () => {
  expectTypeOf<ContentProps<number>>().toBeUnknown();
  expectTypeOf<ContentProps<string>>().toBeUnknown();
  expectTypeOf<ContentProps<boolean>>().toBeUnknown();
});

test('ContentProps works for basic properties', () => {
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

  expectTypeOf<ContentProps<typeof Article>>().toExtend<ExpectedType>();
});

test('ContentProps works for array properties', () => {
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

  expectTypeOf<ContentProps<typeof Article>>().toExtend<ExpectedType>();
});

test('ContentProps works for component properties', () => {
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

  expectTypeOf<ContentProps<typeof Article>>().toExtend<ExpectedType>();
});

test('ContentProps works for disabled keys', () => {
  type ExpectedType = {
    p2: string | null;
  };

  const c1 = contentType({
    key: 'c1',
    baseType: '_component',
    properties: {
      p1: { type: 'string', indexingType: 'disabled' },
      p2: { type: 'string', indexingType: 'queryable' },
    },
  });

  type X = ContentProps<typeof c1>;

  expectTypeOf<ContentProps<typeof c1>>().toExtend<ExpectedType>();
});
