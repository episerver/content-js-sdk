import { describe, expect, test } from 'vitest';
import { buildButtonProps } from '../forms/button.js';

describe('buildButtonProps', () => {
  test.each([
    ['submit', 'submit'],
    ['reset', 'reset'],
    ['next', 'button'],
    ['previous', 'button'],
  ] as const)('the %s role renders type="%s"', (role, type) => {
    expect(buildButtonProps(role, { isSubmitting: false }).type).toBe(type);
  });

  test('disabled only while submitting', () => {
    expect(buildButtonProps('submit', { isSubmitting: true }).disabled).toBe(true);
    expect(buildButtonProps('submit', { isSubmitting: false }).disabled).toBe(false);
  });

  test('a missing tooltip becomes an empty title', () => {
    expect(buildButtonProps('submit', { isSubmitting: false, tooltip: null }).title).toBe('');
    expect(buildButtonProps('submit', { isSubmitting: false, tooltip: 'Send' }).title).toBe(
      'Send',
    );
  });
});
