import { describe, it, expect } from 'vitest';
import { transformProperties } from '../utils/mapping.js';
import {
  HeroComponentType,
  AboutExperienceType,
  BannerComponentType,
} from './fixtures.js';

describe('Testing transformProperties', () => {
  it('should transform heading property correctly', () => {
    const result = transformProperties(HeroComponentType.properties);
    expect(result).toMatchInlineSnapshot(`
      {
        "background": {
          "allowedTypes": [
            "_image",
          ],
          "type": "contentReference",
        },
        "heading": {
          "type": "string",
        },
        "summary": {
          "type": "string",
        },
        "theme": {
          "enum": [
            {
              "displayName": "Light Theme",
              "value": "light",
            },
            {
              "displayName": "Dark Theme",
              "value": "dark",
            },
          ],
          "format": "selectOne",
          "type": "string",
        },
      }
    `);
  });

  it('should transform AboutExperienceType properties correctly', () => {
    const result = transformProperties(AboutExperienceType.properties);
    expect(result).toMatchInlineSnapshot(`
      {
        "section": {
          "restrictedTypes": [
            "HeroComponent",
            "BannerComponent",
          ],
          "type": "content",
        },
        "subtitle": {
          "displayName": "Experience Subtitle",
          "type": "string",
        },
        "title": {
          "displayName": "Experience Title",
          "type": "string",
        },
      }
    `);
  });

  it('should transform BannerComponentType properties correctly', () => {
    const result = transformProperties(BannerComponentType.properties);
    expect(result).toMatchInlineSnapshot(`
      {
        "submit": {
          "type": "link",
        },
        "subtitle": {
          "type": "string",
        },
        "title": {
          "type": "string",
        },
      }
    `);
  });
});
