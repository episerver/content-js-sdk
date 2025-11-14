import { describe, expect, test } from 'vitest';
import { removeTypePrefix } from '../index.js';

describe('removeTypePrefix()', () => {
  test('basic functionality', () => {
    const input = {
      __typename: 'T',
      T__p1: 'p1',
      T__p2: 42,
      T__p3: ['p3', 32],
      T__p4: { nested: 'p4' },
      T__p5: { nested: ['p5'] },
      ShouldBeKept__p6: 'p6',
    };
    const expected = {
      __typename: 'T',
      p1: 'p1',
      p2: 42,
      p3: ['p3', 32],
      p4: { nested: 'p4' },
      p5: { nested: ['p5'] },
      ShouldBeKept__p6: 'p6',
    };
    expect(removeTypePrefix(input)).toStrictEqual(expected);
  });

  test('should remove prefixes only in the same level', () => {
    const input = {
      __typename: 'T',
      T__p1: { T_shouldBeKept: 'shouldBeKept' },
    };
    const expected = {
      __typename: 'T',
      p1: { T_shouldBeKept: 'shouldBeKept' },
    };
    expect(removeTypePrefix(input)).toStrictEqual(expected);
  });

  test('should work for nested objects', () => {
    const input = {
      __typename: 'T',
      T__p1: {
        __typename: 'U',
        U__p1: 'p1',
        U__p2: {
          __typename: 'V',
          V__p1: 'p1',
        },
      },
      T__p2: [{ __typename: 'U', U__p1: 'p1' }],
    };
    const expected = {
      __typename: 'T',
      p1: {
        __typename: 'U',
        p1: 'p1',
        p2: {
          __typename: 'V',
          p1: 'p1',
        },
      },
      p2: [{ __typename: 'U', p1: 'p1' }],
    };
    expect(removeTypePrefix(input)).toStrictEqual(expected);
  });

  test('should not do anything if __typename is not found', () => {
    const input = {
      T__p1: 'hello',
      T__p2: 42,
      T__p3: ['hello', 32],
      T__p4: { nested: 'nested' },
      T__p5: { nested: ['hello'] },
    };

    expect(removeTypePrefix(input)).toStrictEqual(input);
  });
});
