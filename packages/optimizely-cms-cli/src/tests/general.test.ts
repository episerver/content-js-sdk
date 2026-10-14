import { describe, test, expect } from 'vitest';
import { formatCounts, pluralize, validateManifest } from '../utils/general.js';
import { translateErrorMessage } from '../utils/errors.js';

describe('pluralize', () => {
  test.each([
    [0, 'types'],
    [1, 'type'],
    [2, 'types'],
  ])('uses the right form for %i', (count, expected) => {
    expect(pluralize(count, 'type')).toBe(expected);
  });
});

describe('formatCounts', () => {
  test('uses singular wording for one of each', () => {
    expect(
      formatCounts({ contentTypes: [{}], propertyGroups: [{}], displayTemplates: [{}] }),
    ).toBe('1 content type, 1 property group, 1 display template');
  });

  test('uses plural wording for several of each', () => {
    expect(
      formatCounts({
        contentTypes: [{}, {}],
        propertyGroups: [{}, {}, {}],
        displayTemplates: [{}, {}],
      }),
    ).toBe('2 content types, 3 property groups, 2 display templates');
  });

  test('counts missing sections as zero', () => {
    expect(formatCounts({})).toBe('0 content types, 0 property groups, 0 display templates');
  });
});

describe('validateManifest', () => {
  test.each([
    ['null', null],
    ['missing contentTypes', {}],
    ['non-array contentTypes', { contentTypes: {} }],
  ])('rejects %s', (_, response) => {
    expect(validateManifest(response)).toBeFalsy();
  });

  test('accepts a contentTypes array', () => {
    expect(validateManifest({ contentTypes: [] })).toBe(true);
  });
});

describe('translateErrorMessage', () => {
  test('points data-loss warnings on content types to --force', () => {
    expect(
      translateErrorMessage({
        section: 'contentTypes',
        message:
          "Changing Hero loses data. Use the 'ignoreDataLossWarnings' option to apply the changes anyway.",
      }),
    ).toBe("Changing Hero loses data. Use the '--force' flag to apply the changes anyway.");
  });

  test('keeps the message of data-loss warnings from other sections', () => {
    const message = "Use the 'ignoreDataLossWarnings' option to apply the changes anyway.";

    expect(translateErrorMessage({ section: 'propertyGroups', message })).toBe(message);
  });

  test('keeps unrelated content type messages unchanged', () => {
    expect(translateErrorMessage({ section: 'contentTypes', message: 'Invalid key' })).toBe(
      'Invalid key',
    );
  });

  test('returns an empty string for a missing message', () => {
    expect(translateErrorMessage({ section: 'contentTypes', message: null })).toBe('');
  });
});
