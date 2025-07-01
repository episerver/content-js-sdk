import { describe, it, expect } from 'vitest';
import { createDisplayTemplate } from '../displayTemplates.js';

describe('createDisplayTemplate', () => {
  it('should create a display configuration with the correct styles input structure', () => {
    const key = 'exampleConfig';
    const templateType = '_component'; // BaseType
    const stylesInput = {
      color: {
        red: '#ff0000',
        blue: '#0000ff',
      },
      size: {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
      },
    };

    const result = createDisplayTemplate(key, templateType, stylesInput, true);

    expect(result).toMatchInlineSnapshot(`
      {
        "__type": "displayTemplate",
        "contentType": "_component",
        "displayName": "exampleConfig",
        "isDefault": true,
        "key": "exampleConfig",
        "settings": {
          "color": {
            "choices": {
              "blue": {
                "displayName": "Blue",
                "sortOrder": 1,
              },
              "red": {
                "displayName": "Red",
                "sortOrder": 0,
              },
            },
            "displayName": "Color",
            "editor": "select",
            "sortOrder": 0,
          },
          "size": {
            "choices": {
              "large": {
                "displayName": "Large",
                "sortOrder": 2,
              },
              "medium": {
                "displayName": "Medium",
                "sortOrder": 1,
              },
              "small": {
                "displayName": "Small",
                "sortOrder": 0,
              },
            },
            "displayName": "Size",
            "editor": "select",
            "sortOrder": 1,
          },
        },
        "tag": undefined,
        "template": {
          "color": {
            "blue": "#0000ff",
            "red": "#ff0000",
          },
          "size": {
            "large": "Large",
            "medium": "Medium",
            "small": "Small",
          },
        },
      }
    `);
  });

  it('should handle default isDefault value as false', () => {
    const key = 'defaultConfig';
    const templateType = '_component'; // BaseType
    const stylesInput = {
      theme: {
        displayName: 'Theme',
        dark: '#000000',
        editor: 'select',
      },
    };

    const result = createDisplayTemplate(key, templateType, stylesInput);

    expect(result.isDefault).toBe(false);
  });
});
