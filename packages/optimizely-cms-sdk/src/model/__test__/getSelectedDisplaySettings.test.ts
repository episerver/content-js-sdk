import { describe, it, expect, beforeAll } from 'vitest';
import {
  createDisplayTemplate,
  getSelectedDisplaySettings,
} from '../displayTemplates.js';
import { displayTemplateRegistry } from '../index.js';

const componentOne = '';

const componentTwo = '';

const blogTemplate = {
  background: {
    red: '#ff0000',
    blue: '#0000ff',
  },
  fontSize: {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
  },
};

const tileTemplate = {
  background: {
    white: '#ffffff',
    black: '#000000',
  },
  boder: {
    suqare: 'Square',
    circle: 'Circle',
    rounded: 'Rounded',
  },
};

const heroTemplate = {
  height: {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
  },
  width: {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
  },
};

const sectionTemplate = {
  visible: {
    displayName: 'Visible on page',
    editor: 'checkbox',
    value: 'display-none',
  },
};

const BlogCardDisplayTemplate = createDisplayTemplate(
  'BlogCardDisplayTemplate',
  '_component',
  blogTemplate,
  true
);

const TileDisplayTemplate = createDisplayTemplate(
  'TileDisplayTemplate',
  '_component',
  tileTemplate,
  true
);

const HeroDisplayTemplate = createDisplayTemplate(
  'HeroDisplayTemplate',
  '_component',
  heroTemplate,
  true
);

const SectionDisplayTemplate = createDisplayTemplate(
  'SectionDisplayTemplate',
  '_section',
  sectionTemplate,
  true
);

beforeAll(() => {
  displayTemplateRegistry([
    BlogCardDisplayTemplate,
    TileDisplayTemplate,
    HeroDisplayTemplate,
    SectionDisplayTemplate,
  ]);
});

describe('getSelectedDisplaySettings', () => {
  it('should return the selected display settings for a valid input', () => {
    // displaySettings structure from GrpahQL graph
    const input = [
      { key: 'background', value: 'white' },
      { key: 'boder', value: 'rounded' },
    ];

    const { displaySettings } = getSelectedDisplaySettings(
      input,
      'TileDisplayTemplate'
    );

    expect(displaySettings).toMatchInlineSnapshot(`
      [
        "#ffffff",
        "Rounded",
      ]
    `);
  });

  it('should return the selected display settings for a checkbox editor', () => {
    const input = [{ key: 'visible', value: 'true' }];

    const { displaySettings } = getSelectedDisplaySettings(
      input,
      'SectionDisplayTemplate'
    );

    expect(displaySettings).toMatchInlineSnapshot(`
      [
        "display-none",
      ]
    `);
  });

  it('should return an empty array if displaySettings is empty', () => {
    const input: { key: string; value: string }[] = [];
    const { displaySettings } = getSelectedDisplaySettings(
      input,
      'BlogCardDisplayTemplate'
    );
    expect(displaySettings).toEqual([]);
  });

  it('should return an empty array if templateName is not found', () => {
    const input = [{ key: 'background', value: 'red' }];
    const { displaySettings } = getSelectedDisplaySettings(
      input,
      'NonExistentTemplate'
    );
    expect(displaySettings).toEqual([]);
  });

  it('should return an empty array for keys not found in the template', () => {
    const input = [{ key: 'nonExistentKey', value: 'someValue' }];
    const { displaySettings } = getSelectedDisplaySettings(
      input,
      'BlogCardDisplayTemplate'
    );
    expect(displaySettings).toEqual([]);
  });

  it('should return an empty array for values not found in the template', () => {
    const input = [{ key: 'background', value: 'nonExistentValue' }];
    const { displaySettings } = getSelectedDisplaySettings(
      input,
      'BlogCardDisplayTemplate'
    );
    expect(displaySettings).toEqual([]);
  });

  it('should handle multiple settings correctly', () => {
    const input = [
      { key: 'height', value: 'medium' },
      { key: 'width', value: 'large' },
    ];
    const { displaySettings } = getSelectedDisplaySettings(
      input,
      'HeroDisplayTemplate'
    );
    expect(displaySettings).toMatchInlineSnapshot(`
      [
        "Medium",
        "Large",
      ]
    `);
  });
});
