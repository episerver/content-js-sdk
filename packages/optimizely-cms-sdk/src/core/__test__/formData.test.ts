import { describe, expect, test } from 'vitest';
import { dropShadowedBlanks } from '../forms/formData.js';

const formData = (entries: [string, string][]) => {
  const data = new FormData();
  entries.forEach(([name, value]) => data.append(name, value));
  return data;
};

describe('dropShadowedBlanks', () => {
  test('a name repeated across steps keeps only the answered value', () => {
    const result = dropShadowedBlanks(
      formData([
        ['email', ''],
        ['email', 'someone@example.com'],
        ['name', 'Ada'],
      ]),
    );

    expect(result.getAll('email')).toEqual(['someone@example.com']);
    expect(result.getAll('name')).toEqual(['Ada']);
  });

  test('a name blank everywhere is left alone', () => {
    const result = dropShadowedBlanks(
      formData([
        ['email', ''],
        ['email', ''],
      ]),
    );

    expect(result.getAll('email')).toEqual(['', '']);
  });

  test('two real answers under one name both survive', () => {
    const result = dropShadowedBlanks(
      formData([
        ['topic', 'a'],
        ['topic', 'b'],
      ]),
    );

    expect(result.getAll('topic')).toEqual(['a', 'b']);
  });
});
