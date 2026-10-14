import { describe, expect, test } from 'vitest';
import { DEFAULT_STEP_BUTTON_LABELS, getFormButtonRole } from '../buttonRole.js';

describe('getFormButtonRole', () => {
  // A server component needs this to align a button footer, so it must work
  // without React. `useFormButton` is a client hook and cannot be called there.
  test('reads the role from a label, ignoring case and surrounding whitespace', () => {
    expect(getFormButtonRole({ Label: 'Next' })).toBe('next');
    expect(getFormButtonRole({ Label: '  PREVIOUS ' })).toBe('previous');
    expect(getFormButtonRole({ Label: 'Send' })).toBe('submit');
  });

  test("treats 'back' as previous by default", () => {
    expect(DEFAULT_STEP_BUTTON_LABELS.previous).toContain('back');
    expect(getFormButtonRole({ Label: 'Back' })).toBe('previous');
  });

  test('custom labels replace the defaults for their role only', () => {
    const options = { labels: { previous: ['tillbaka'] } };

    expect(getFormButtonRole({ Label: 'Tillbaka' }, options)).toBe('previous');
    expect(getFormButtonRole({ Label: 'Back' }, options)).toBe('submit');
    expect(getFormButtonRole({ Label: 'Next' }, options)).toBe('next');
  });

  test('an explicit role wins over the label', () => {
    expect(getFormButtonRole({ Label: 'Next' }, { role: 'reset' })).toBe('reset');
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['blank', '   '],
  ])('a %s label is a submit button', (_label, Label) => {
    expect(getFormButtonRole({ Label })).toBe('submit');
  });
});
