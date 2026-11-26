import { describe, test, expect } from 'vitest';
import { classifyItems, hasStatus, type StoredItem } from '../utils/patchStatus.js';

const ID = 'contentTypes:Tile';
const stored: StoredItem = { local: 'L0', server: 'S0' };

// one item: local hash, server hash, stored hashes (undefined = absent)
const classifyOne = (local?: string, server?: string, storedItem?: StoredItem) =>
  classifyItems(
    local ? { [ID]: local } : {},
    server ? { [ID]: server } : {},
    storedItem ? { [ID]: storedItem } : {},
  );

describe('classifyItems with stored state', () => {
  test.each([
    ['unchanged', 'L0', 'S0', { status: 'unchanged' }],
    ['changed locally', 'L1', 'S0', { status: 'changed' }],
    ['changed on the server', 'L0', 'S1', { status: 'outdated' }],
    ['changed on both sides', 'L1', 'S1', { status: 'conflict', reason: 'bothChanged' }],
    ['changed on both sides to the same content', 'X', 'X', { status: 'inSync' }],
    ['changed locally to match the server', 'S0', 'S0', { status: 'inSync' }],
    ['removed locally', undefined, 'S0', { status: 'removed' }],
    ['removed locally and changed on the server', undefined, 'S1', { status: 'removed' }],
    ['deleted on the server', 'L0', undefined, { status: 'deletedOnServer' }],
    [
      'changed locally and deleted on the server',
      'L1',
      undefined,
      { status: 'conflict', reason: 'deletedOnServer' },
    ],
    ['gone from both sides', undefined, undefined, { status: 'gone' }],
  ])('%s', (_, local, server, expected) => {
    expect(classifyOne(local, server, stored)).toEqual([{ id: ID, ...expected }]);
  });
});

describe('classifyItems without stored state', () => {
  test.each([
    ['new', 'L0', undefined, { status: 'new' }],
    ['equal to the server copy', 'X', 'X', { status: 'inSync' }],
    ['different from the server copy', 'L0', 'S0', { status: 'conflict', reason: 'noState' }],
  ])('%s', (_, local, server, expected) => {
    expect(classifyOne(local, server)).toEqual([{ id: ID, ...expected }]);
  });

  test('leaves out server items that are neither local nor stored', () => {
    expect(classifyOne(undefined, 'S0')).toEqual([]);
  });
});

test('classifies every item, sorted by id', () => {
  const result = classifyItems(
    { 'contentTypes:Tile': 'L1', 'propertyGroups:seo': 'G0', 'contentTypes:Hero': 'H0' },
    { 'contentTypes:Tile': 'S0', 'contentTypes:Hero': 'H0', 'contentTypes:Other': 'O0' },
    { 'contentTypes:Tile': stored, 'displayTemplates:Old': { local: 'D0', server: 'D0' } },
  );

  expect(result).toEqual([
    { id: 'contentTypes:Hero', status: 'inSync' },
    { id: 'contentTypes:Tile', status: 'changed' },
    { id: 'displayTemplates:Old', status: 'gone' },
    { id: 'propertyGroups:seo', status: 'new' },
  ]);
});

test('hasStatus matches any of the given statuses', () => {
  const statuses = [
    { id: 'a', status: 'changed' },
    { id: 'b', status: 'new' },
    { id: 'c', status: 'conflict', reason: 'noState' },
  ] as const;

  expect(statuses.filter(hasStatus('changed', 'conflict')).map(it => it.id)).toEqual(['a', 'c']);
});
