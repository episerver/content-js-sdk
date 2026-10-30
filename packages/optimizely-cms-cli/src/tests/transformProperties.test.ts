import { describe, it, test, expect } from 'vitest';
import { transformProperties } from '../utils/mapping.js';
import {
  HeroComponentType,
  AboutExperienceType,
  BannerComponentType,
} from './fixtures.js';

describe('Testing transformProperties', () => {
  it('should keep HeroComponentType properties without content type objects unchanged', () => {
    const result = transformProperties(
      HeroComponentType.properties,
      HeroComponentType.key,
    );
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
          "type": "string",
        },
      }
    `);
  });

  it('should transform AboutExperienceType properties correctly', () => {
    const result = transformProperties(
      AboutExperienceType.properties,
      AboutExperienceType.key,
    );
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

  it('should pass through string key allowedTypes unchanged', () => {
    const properties = {
      relatedContent: {
        type: 'content' as const,
        allowedTypes: ['HeroComponent', 'BannerComponent'],
      },
    };
    const result = transformProperties(properties, 'ArticlePage');
    expect(result).toMatchInlineSnapshot(`
      {
        "relatedContent": {
          "allowedTypes": [
            "HeroComponent",
            "BannerComponent",
          ],
          "type": "content",
        },
      }
    `);
  });

  it('should transform mix of ContentType objects and string keys', () => {
    const properties = {
      section: {
        type: 'content' as const,
        restrictedTypes: [HeroComponentType, 'SomeOtherComponent'] as any[],
      },
    };
    const result = transformProperties(properties, 'TestPage');
    expect(result).toMatchInlineSnapshot(`
      {
        "section": {
          "restrictedTypes": [
            "HeroComponent",
            "SomeOtherComponent",
          ],
          "type": "content",
        },
      }
    `);
  });

  it('should remove wildcard from allowedTypes', () => {
    const properties = {
      anyContent: {
        type: 'content' as const,
        allowedTypes: ['*'],
      },
    };
    const result = transformProperties(properties, 'QAContentAreaPage');
    expect(result).toMatchInlineSnapshot(`
      {
        "anyContent": {
          "type": "content",
        },
      }
    `);
  });

  it('should remove wildcard from restrictedTypes', () => {
    const properties = {
      someContent: {
        type: 'contentReference' as const,
        restrictedTypes: ['*'],
      },
    };
    const result = transformProperties(properties, 'TestPage');
    expect(result).toMatchInlineSnapshot(`
      {
        "someContent": {
          "type": "contentReference",
        },
      }
    `);
  });

  it('should filter out wildcard when mixed with other types in allowedTypes', () => {
    const properties = {
      mixedContent: {
        type: 'content' as const,
        allowedTypes: ['*', 'HeroComponent'],
      },
    };
    const result = transformProperties(properties, 'TestPage');
    expect(result).toMatchInlineSnapshot(`
      {
        "mixedContent": {
          "allowedTypes": [
            "HeroComponent",
          ],
          "type": "content",
        },
      }
    `);
  });

  test('replaces a component contentType object with its key', () => {
    const result = transformProperties(
      { banner: { type: 'component', contentType: BannerComponentType } },
      'TestPage',
    );

    expect(result).toEqual({ banner: { type: 'component', contentType: 'BannerComponent' } });
  });

  test('marks link arrays as LinkCollection', () => {
    const result = transformProperties(
      { links: { type: 'array', items: { type: 'link' } } },
      'TestPage',
    );

    expect(result).toEqual({
      links: { type: 'array', format: 'LinkCollection', items: { type: 'link' } },
    });
  });

  test('replaces the contentType object of component array items with its key', () => {
    const result = transformProperties(
      { banners: { type: 'array', items: { type: 'component', contentType: BannerComponentType } } },
      'TestPage',
    );

    expect(result).toEqual({
      banners: { type: 'array', items: { type: 'component', contentType: 'BannerComponent' } },
    });
  });

  test('replaces the contentType object of contentReference array items with its key', () => {
    const result = transformProperties(
      {
        heroes: {
          type: 'array',
          items: { type: 'contentReference', contentType: HeroComponentType },
        },
      },
      'TestPage',
    );

    expect(result).toEqual({
      heroes: { type: 'array', items: { type: 'contentReference', contentType: 'HeroComponent' } },
    });
  });

  test('replaces a contentReference contentType object with its key', () => {
    const result = transformProperties(
      { hero: { type: 'contentReference', contentType: HeroComponentType } },
      'TestPage',
    );

    expect(result).toEqual({ hero: { type: 'contentReference', contentType: 'HeroComponent' } });
  });

  test('resolves _self in allowedTypes and restrictedTypes to the parent key', () => {
    const result = transformProperties(
      {
        children: { type: 'content', allowedTypes: ['_self'] },
        nested: {
          type: 'array',
          items: { type: 'contentReference', restrictedTypes: ['_self'] },
        },
      },
      'FolderPage',
    );

    expect(result).toEqual({
      children: { type: 'content', allowedTypes: ['FolderPage'] },
      nested: { type: 'array', items: { type: 'contentReference', restrictedTypes: ['FolderPage'] } },
    });
  });
});

describe('mock values', () => {
  test('are stripped: they belong to previews, not to the content model', () => {
    const result = transformProperties(
      {
        heading: { type: 'string', displayName: 'Heading', mock: 'Built for the long run' },
        featured: { type: 'boolean', mock: true },
      } as any,
      'Hero',
    );

    expect(result).toEqual({
      heading: { type: 'string', displayName: 'Heading' },
      featured: { type: 'boolean' },
    });
  });

  test('are stripped from array items as well', () => {
    const result = transformProperties(
      { tags: { type: 'array', items: { type: 'string', mock: 'running' } } } as any,
      'Hero',
    );

    expect(result).toEqual({ tags: { type: 'array', items: { type: 'string' } } });
  });

  test('a property with no mock is untouched', () => {
    const result = transformProperties({ heading: { type: 'string' } } as any, 'Hero');

    expect(result).toEqual({ heading: { type: 'string' } });
  });
});
