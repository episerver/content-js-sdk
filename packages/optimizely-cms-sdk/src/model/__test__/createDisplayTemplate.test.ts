import { describe, it, expect } from 'vitest';
import { createDisplayTemplate } from '../displayTemplates.js';
import { contentType } from '../index.js';

describe('createDisplayTemplate', () => {
  it('should create a display template correctly', () => {
    const input = {
      background: { red: '#ff0000', blue: '#0000ff' },
    };

    const result = createDisplayTemplate(input);

    expect(result).toMatchInlineSnapshot(`
      {
        "background": {
          "blue": "#0000ff",
          "red": "#ff0000",
        },
      }
    `);
  });

  it('should handle editor and value properties', () => {
    const input = {
      background: {
        editor: 'select',
        blue: '#0000ff',
        red: '#ff0000',
      },
    };

    const result = createDisplayTemplate(input);

    expect(result).toMatchInlineSnapshot(`
      {
        "background": {
          "blue": "#0000ff",
          "editor": "select",
          "red": "#ff0000",
        },
      }
    `);
  });

  it('should handle when contentType are passed', () => {
    const componentA = contentType({
      key: 'componentA',
      baseType: '_component',
      properties: {
        color: {
          type: 'string',
        },
      },
    });

    const componentB = contentType({
      key: 'componentB',
      baseType: '_component',
      properties: {
        background: {
          type: 'string',
        },
      },
    });

    const input = {
      mainComponent: {
        componentA,
        componentB,
      },
    };

    const result = createDisplayTemplate(input);

    expect(result).toMatchInlineSnapshot(`
      {
        "mainComponent": {
          "componentA": "componentA",
          "componentB": "componentB",
        },
      }
    `);
  });

  it('should handle when contentType are passed', () => {
    const componentA = contentType({
      key: 'componentA',
      baseType: '_component',
      properties: {
        color: {
          type: 'string',
        },
      },
    });

    const input = {
      mainComponent: {
        componentA,
        editor: 'checkbox',
      },
    };

    const result = createDisplayTemplate(input);

    expect(result).toMatchInlineSnapshot(`
      {
        "mainComponent": {
          "componentA": "componentA",
          "editor": "checkbox",
        },
      }
    `);
  });
});
