import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizePropertyGroups } from '../service/utils.js';

describe('normalizePropertyGroups', () => {
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should handle duplicate keys by keeping the first occurrence', () => {
    const input = [
      {
        key: 'seo',
        displayName: 'SEO',
        sortOrder: 1,
      },
      {
        key: 'seo',
        displayName: 'SEO Updated',
        sortOrder: 5,
      },
      {
        key: 'meta',
        displayName: 'Meta',
        sortOrder: 2,
      },
    ];

    const result = normalizePropertyGroups(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      key: 'seo',
      displayName: 'SEO',
      sortOrder: 1,
    });
    expect(result[1]).toEqual({
      key: 'meta',
      displayName: 'Meta',
      sortOrder: 2,
    });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate property group keys found: seo'),
    );
  });

  it('should handle multiple duplicates correctly', () => {
    const input = [
      {
        key: 'seo',
        displayName: 'SEO 1',
        sortOrder: 1,
      },
      {
        key: 'meta',
        displayName: 'Meta',
        sortOrder: 2,
      },
      {
        key: 'seo',
        displayName: 'SEO 2',
        sortOrder: 3,
      },
      {
        key: 'layout',
        displayName: 'Layout',
        sortOrder: 4,
      },
      {
        key: 'seo',
        displayName: 'SEO Final',
        sortOrder: 5,
      },
    ];

    const result = normalizePropertyGroups(input);

    expect(result).toHaveLength(3);
    expect(result.find((g) => g.key === 'seo')).toEqual({
      key: 'seo',
      displayName: 'SEO 1',
      sortOrder: 1,
    });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate property group keys found: seo'),
    );
  });

  it('should auto-generate displayName from key if missing', () => {
    const input = [
      {
        key: 'seo',
        sortOrder: 1,
      },
    ];

    const result = normalizePropertyGroups(input);

    expect(result[0]).toEqual({
      key: 'seo',
      displayName: 'Seo',
      sortOrder: 1,
    });
  });

  it('should auto-assign sortOrder based on array position if missing', () => {
    const input = [
      {
        key: 'first',
        displayName: 'First',
      },
      {
        key: 'second',
        displayName: 'Second',
      },
      {
        key: 'third',
        displayName: 'Third',
      },
    ];

    const result = normalizePropertyGroups(input);

    expect(result[0].sortOrder).toBe(1);
    expect(result[1].sortOrder).toBe(2);
    expect(result[2].sortOrder).toBe(3);
  });

  it('should throw error for empty key', () => {
    const input = [
      {
        key: '',
        displayName: 'Empty',
        sortOrder: 1,
      },
    ];

    expect(() => normalizePropertyGroups(input)).toThrow(
      'Error in property groups: Property group at index 0 has an empty or missing "key" field',
    );
  });

  it('should throw error for missing key', () => {
    const input = [
      {
        displayName: 'No Key',
        sortOrder: 1,
      },
    ];

    expect(() => normalizePropertyGroups(input)).toThrow(
      'Error in property groups: Property group at index 0 has an empty or missing "key" field',
    );
  });

  it('should throw error if propertyGroups is not an array', () => {
    expect(() => normalizePropertyGroups({} as any)).toThrow(
      'propertyGroups must be an array',
    );
  });

  it('should handle empty array', () => {
    const result = normalizePropertyGroups([]);
    expect(result).toEqual([]);
  });

  it('should preserve order for non-duplicate keys', () => {
    const input = [
      {
        key: 'first',
        displayName: 'First',
        sortOrder: 1,
      },
      {
        key: 'second',
        displayName: 'Second',
        sortOrder: 2,
      },
      {
        key: 'third',
        displayName: 'Third',
        sortOrder: 3,
      },
    ];

    const result = normalizePropertyGroups(input);

    expect(result[0].key).toBe('first');
    expect(result[1].key).toBe('second');
    expect(result[2].key).toBe('third');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
