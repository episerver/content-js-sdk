import { describe, expect, test } from 'vitest';
import { getElementId, getElementIds } from '../forms/elementId.js';

describe('getElementIds', () => {
  test('lists the composition key, metadata key and _id, most specific first', () => {
    expect(
      getElementIds({ __composition: { key: 'node' }, _metadata: { key: 'content' }, _id: 'graph-id' }),
    ).toEqual(['node', 'content', 'graph-id']);
  });

  test('falls back to _id when there is no key', () => {
    expect(getElementIds({ _id: 'graph-id' })).toEqual(['graph-id']);
  });

  test('drops empty and non-string candidates', () => {
    expect(getElementIds({ __composition: { key: '' }, _metadata: { key: 7 }, _id: 'graph-id' })).toEqual([
      'graph-id',
    ]);
  });

  test('lists an id shared by several candidates once', () => {
    expect(getElementIds({ __composition: { key: 'same' }, _metadata: { key: 'same' } })).toEqual(['same']);
  });

  test('is empty for missing content', () => {
    expect(getElementIds(undefined)).toEqual([]);
    expect(getElementIds({})).toEqual([]);
  });
});

describe('getElementId', () => {
  test('returns the most specific non-empty id', () => {
    expect(getElementId({ __composition: { key: '' }, _metadata: { key: 'content' }, _id: 'graph-id' })).toBe(
      'content',
    );
  });

  test('is undefined when the content has no id', () => {
    expect(getElementId({ title: 'Untitled' })).toBeUndefined();
    expect(getElementId(undefined)).toBeUndefined();
  });
});
