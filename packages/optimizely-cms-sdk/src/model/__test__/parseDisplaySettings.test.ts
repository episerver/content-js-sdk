import { describe, it, expect } from 'vitest';
import { parseDisplaySettings } from '../displayTemplates.js';

describe('parseDisplaySettings', () => {
  it('should parse valid display settings correctly', () => {
    const input = [
      { key: 'layout', value: 'grid' },
      { key: 'theme', value: 'dark' },
    ];
    const result = parseDisplaySettings(input);
    expect(result).toEqual({
      layout: 'grid',
      theme: 'dark',
    });
  });

  it('should handle missing properties gracefully', () => {
    const input = [{ key: 'layout', value: 'grid' }];
    const result = parseDisplaySettings(input);
    expect(result).toEqual({
      layout: 'grid',
    });
  });

  it('should return an empty object for null input', () => {
    const input = null;
    const result = parseDisplaySettings(input ?? undefined);
    expect(result).toEqual(undefined);
  });

  it('should return an empty object for undefined input', () => {
    const input = undefined;
    const result = parseDisplaySettings(input);
    expect(result).toEqual(undefined);
  });
});