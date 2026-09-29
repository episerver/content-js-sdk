import { describe, expect, test } from 'vitest';
import { splitAttributes } from '../richText/attributes.js';

describe('splitAttributes', () => {
  test('CSS keys move to camelCased styles, the rest stay attributes', () => {
    expect(splitAttributes({ 'font-size': '14px', class: 'lead', id: 'x' })).toEqual({
      attributes: { class: 'lead', id: 'x' },
      style: { fontSize: '14px' },
    });
  });

  test('dual-purpose keys are attributes only on the elements that take them', () => {
    expect(splitAttributes({ width: '100' }, 'img')).toEqual({
      attributes: { width: '100' },
      style: {},
    });
    expect(splitAttributes({ width: '100px' }, 'div')).toEqual({
      attributes: {},
      style: { width: '100px' },
    });
  });

  test('old shorthand keys resolve to their text- property', () => {
    expect(splitAttributes({ decoration: 'underline' }).style).toEqual({
      textDecoration: 'underline',
    });
  });

  test('a style string is parsed, and later CSS keys override it', () => {
    expect(splitAttributes({ style: 'color: red; margin: 0', color: 'blue' }).style).toEqual({
      color: 'blue',
      margin: '0',
    });
  });
});
