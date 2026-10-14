import { describe, test, expect } from 'vitest';
import {
  contractToManifest,
  filterOutBuiltinTypes,
  validateContentTypeKey,
} from '../utils/mapping.js';
import { manifestContentType } from './helpers.js';

describe('validateContentTypeKey', () => {
  test.each(['Hero', 'hero_2', 'Landing_Page'])('accepts %s', key => {
    expect(() => validateContentTypeKey(key)).not.toThrow();
  });

  test.each([
    ['a leading underscore', '_Hero'],
    ['a leading digit', '2Hero'],
    ['a hyphen', 'Hero-Banner'],
    ['a space', 'Hero Banner'],
    ['an empty key', ''],
  ])('rejects a key with %s', (_, key) => {
    expect(() => validateContentTypeKey(key)).toThrow(`Invalid content type key: "${key}"`);
  });
});

describe('filterOutBuiltinTypes', () => {
  test('drops BlankExperience and BlankSection and keeps everything else in order', () => {
    const contentTypes = ['Hero', 'BlankExperience', 'BlankSection', 'Page'].map(key =>
      manifestContentType(key),
    );

    expect(filterOutBuiltinTypes(contentTypes).map(it => it.key)).toEqual(['Hero', 'Page']);
  });
});

describe('contractToManifest', () => {
  test('marks the contract and transforms its properties', () => {
    const result = contractToManifest({
      __type: 'contract',
      key: 'SeoContract',
      displayName: 'SEO',
      properties: {
        related: { type: 'contentReference', allowedTypes: ['_self', '*'] },
      },
    } as never);

    expect(result).toEqual({
      key: 'SeoContract',
      displayName: 'SEO',
      isContract: true,
      properties: {
        related: { type: 'contentReference', allowedTypes: ['SeoContract'] },
      },
    });
  });

  test('leaves properties undefined for a contract without properties', () => {
    const result = contractToManifest({
      __type: 'contract',
      key: 'EmptyContract',
      displayName: 'Empty',
    } as never);

    expect(result).toEqual({
      key: 'EmptyContract',
      displayName: 'Empty',
      isContract: true,
      properties: undefined,
    });
  });
});
