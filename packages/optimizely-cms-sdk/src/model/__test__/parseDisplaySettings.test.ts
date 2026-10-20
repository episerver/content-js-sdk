import { describe, expect, test } from 'vitest';
import { parseDisplaySettings } from '../displayTemplates.js';

describe('parseDisplaySettings', () => {
  test('maps each key to its value', () => {
    const input = [
      { key: 'layout', value: 'grid' },
      { key: 'theme', value: 'dark' },
    ];

    expect(parseDisplaySettings(input)).toEqual({ layout: 'grid', theme: 'dark' });
  });

  test("converts 'true' and 'false' to booleans and leaves other strings alone", () => {
    const input = [
      { key: 'boxed', value: 'true' },
      { key: 'rounded', value: 'false' },
      { key: 'label', value: 'TRUE' },
    ];

    expect(parseDisplaySettings(input)).toEqual({ boxed: true, rounded: false, label: 'TRUE' });
  });

  test('a later entry for the same key wins', () => {
    const input = [
      { key: 'layout', value: 'grid' },
      { key: 'layout', value: 'list' },
    ];

    expect(parseDisplaySettings(input)).toEqual({ layout: 'list' });
  });

  test('returns an empty object for an empty array', () => {
    expect(parseDisplaySettings([])).toEqual({});
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
  ])('returns undefined for %s', (_label, input) => {
    expect(parseDisplaySettings(input)).toBeUndefined();
  });
});
