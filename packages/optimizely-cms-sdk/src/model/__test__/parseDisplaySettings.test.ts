import { describe, it, expect } from 'vitest';
import { parseDisplaySettings } from '../displayTemplates.js';


describe('parseDisplaySettings', () => {
  it('should parse valid display settings correctly', () => {
    const template = {
      settings: {
        layout: { editor: 'select', choices: { grid: {}, list: {} } },
        theme: { editor: 'select', choices: { dark: {}, light: {} } }
      }
    } as any;

    const input = [
      { key: 'layout', value: 'grid' },
      { key: 'theme', value: 'dark' }
    ];

    const result = parseDisplaySettings(input, template.settings);
    expect(result).toEqual({
      layout: 'grid',
      theme: 'dark'
    });
  });

  it('should handle checkbox correctly', () => {
    const template = {
      settings: {
        showImage: { editor: 'checkbox', choices: {} }
      }
    } as any;

    const input = [{ key: 'showImage', value: 'true' }];
    const result = parseDisplaySettings(input, template.settings);
    expect(result).toEqual({
      showImage: 'true'
    });
  });

  it('should return undefined for null input', () => {
    const template = { settings: {} } as any;
    const input = null;
    const result = parseDisplaySettings(input, template.settings);
    expect(result).toEqual({});
  });

  it('should return undefined for undefined input', () => {
    const template = { settings: {} } as any;
    const input = undefined;
    const result = parseDisplaySettings(input, template.settings);
    expect(result).toEqual({});
  });
});

