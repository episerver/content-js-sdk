import { describe, expectTypeOf, test } from 'vitest';
import { contentType } from '../../model/index.js';
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
