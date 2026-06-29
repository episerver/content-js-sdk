import { test, expectTypeOf } from 'vitest';
import type { ContentProps, InferredAssetMetadata, InferredImageMetadata } from './infer.js';
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
    displayName: 'Article',
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
    displayName: 'Article',
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
    displayName: 'Hero',
    baseType: '_component',
    properties: {
      image: { type: 'contentReference' },
    },
  });

  const Article = contentType({
    key: 'Article',
    displayName: 'Article',
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

test('ContentProps includes _imageMetadata and _assetMetadata for image base type', () => {
  const ImageType = contentType({
    key: 'ImageMedia',
    displayName: 'Image Media',
    baseType: '_image',
    properties: {
      altText: { type: 'string' },
    },
  });

  type Result = ContentProps<typeof ImageType>;

  expectTypeOf<Result>().toHaveProperty('_imageMetadata');
  expectTypeOf<Result>().toHaveProperty('_assetMetadata');
  expectTypeOf<Result['_imageMetadata']>().toEqualTypeOf<InferredImageMetadata>();
  expectTypeOf<Result['_assetMetadata']>().toEqualTypeOf<InferredAssetMetadata>();
});

test('ContentProps includes _assetMetadata but not _imageMetadata for video base type', () => {
  const VideoType = contentType({
    key: 'VideoMedia',
    displayName: 'Video Media',
    baseType: '_video',
    properties: {
      duration: { type: 'integer' },
    },
  });

  type Result = ContentProps<typeof VideoType>;

  expectTypeOf<Result>().toHaveProperty('_assetMetadata');
  expectTypeOf<Result['_assetMetadata']>().toEqualTypeOf<InferredAssetMetadata>();
  expectTypeOf<Result>().not.toHaveProperty('_imageMetadata');
});

test('ContentProps does not include _assetMetadata or _imageMetadata for page base type', () => {
  const PageType = contentType({
    key: 'StartPage',
    displayName: 'Start Page',
    baseType: '_page',
    properties: {
      title: { type: 'string' },
    },
  });

  type Result = ContentProps<typeof PageType>;

  expectTypeOf<Result>().not.toHaveProperty('_imageMetadata');
  expectTypeOf<Result>().not.toHaveProperty('_assetMetadata');
});

test('ContentProps works for disabled keys', () => {
  type ExpectedType = {
    p2: string | null;
  };

  const c1 = contentType({
    key: 'c1',
    displayName: 'C1',
    baseType: '_component',
    properties: {
      p1: { type: 'string', indexingType: 'disabled' },
      p2: { type: 'string', indexingType: 'queryable' },
    },
  });

  type X = ContentProps<typeof c1>;

  expectTypeOf<ContentProps<typeof c1>>().toExtend<ExpectedType>();
});
