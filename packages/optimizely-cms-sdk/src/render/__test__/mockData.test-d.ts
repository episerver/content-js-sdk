import { describe, expectTypeOf, test } from 'vitest';
import { contentType } from '../../model/index.js';
import { withMock } from '../withMock.js';
import {
  generateMockContent,
  type FakerLike,
  type MockData,
  type MockDataFactory,
  type MockDataOverrides,
} from '../mockContent.js';

const Hero = contentType({
  key: 'Hero',
  displayName: 'Hero',
  baseType: '_component',
  properties: { Headline: { type: 'string' } },
});

describe('mockData', () => {
  /**
   * The provider shape `docs/guides/mock-content.md` tells readers to implement.
   * If this stops compiling, that guide is wrong.
   */
  test('a hand-written source satisfies the provider contract', () => {
    // Mirrors the seed-driven source in the guide: `seed` chooses the record,
    // every method then reads from it.
    const records = [{ title: 'Trail Runner', price: '149.00' }];
    let current = records[0];

    const custom: FakerLike = {
      seed: value => (current = records[value % records.length]),
      lorem: {
        words: (count = 3) => Array.from({ length: count }, () => 'tag').join(' '),
        paragraph: () => 'A sentence from somewhere else.',
      },
      person: { fullName: () => 'Ada Lovelace' },
      internet: { email: () => 'ada@example.com', url: () => 'https://example.com' },
      commerce: { productName: () => current.title, price: () => current.price },
      number: { int: ({ min }) => min },
      // The reference date is supplied, so an implementation never has to read
      // the clock — and is free to ignore it.
      date: { past: () => new Date('2020-01-01') },
    };

    expectTypeOf(custom).toExtend<MockData>();
    expectTypeOf(generateMockContent(Hero, { mockData: custom })).toBeObject();
  });

  test('predefined content per content type is accepted', () => {
    const overrides: MockDataOverrides = { Hero: { Headline: 'Set it. Sweat it.' } };

    expectTypeOf(overrides).toExtend<MockData>();
    expectTypeOf(generateMockContent(Hero, { mockData: overrides })).toBeObject();
  });

  test('a factory sees the content type and what the schema produced', () => {
    const factory: MockDataFactory = (type, generated) => ({
      ...generated,
      Headline: `From ${type.key}`,
    });

    expectTypeOf(factory).toExtend<MockData>();
    expectTypeOf(generateMockContent(Hero, { mockData: factory })).toBeObject();
  });

  test('a factory may decline by returning nothing', () => {
    expectTypeOf<undefined>().toExtend<ReturnType<MockDataFactory>>();
  });
});

describe('withMock', () => {
  const Article = contentType({
    key: 'Article',
    displayName: 'Article',
    baseType: '_page',
    properties: {
      Title: { type: 'string' },
      Featured: { type: 'boolean' },
    },
  });

  const Component = (_: unknown) => null;

  test('takes the properties the content type declares', () => {
    withMock(Component, Article, { Title: 'Built for the long run' });
    withMock(Component, Article, { Title: 'x', Featured: true });
  });

  test('rejects a property the content type does not have', () => {
    // @ts-expect-error `Headline` is not a property of Article.
    withMock(Component, Article, { Headline: 'x' });
  });

  test('rejects a value of the wrong type', () => {
    // @ts-expect-error `Featured` is a boolean.
    withMock(Component, Article, { Featured: 'yes' });
  });

  test('rejects base fields: those belong to the preview, not the component', () => {
    // @ts-expect-error `_metadata` is not a declared property.
    withMock(Component, Article, { _metadata: { key: 'pinned' } });

    // @ts-expect-error `_id` likewise.
    withMock(Component, Article, { _id: 'pinned' });
  });

  test('a function may read everything the schema produced', () => {
    withMock(Component, Article, ({ generated }) => {
      expectTypeOf(generated._metadata).not.toBeNever();
      return { Title: `after ${String(generated.Title)}` };
    });
  });

  test('returns the component it was given, so it can be exported directly', () => {
    expectTypeOf(withMock(Component, Article, { Title: 'x' })).toEqualTypeOf<typeof Component>();
  });
});
