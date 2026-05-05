import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { generateCode, generateFilePath, generateGroups } from '../utils/generate.js';
import { Manifest, ContentType, DisplayTemplate } from '../utils/manifest.js';

const mockContract: ContentType = {
  key: 'SEOContract',
  displayName: 'SEO Contract',
  isContract: true,
  properties: {
    metaTitle: { type: 'string' },
    metaDescription: { type: 'string' },
  },
};

const mockContentType: ContentType = {
  key: 'ArticlePage',
  displayName: 'Article Page',
  baseType: '_page',
  isContract: false,
  properties: {
    heading: { type: 'string' },
    body: { type: 'richText' },
  },
  mayContainTypes: ['HeroComponent'],
};

const mockContentTypeWithContract: ContentType = {
  key: 'BlogPost',
  displayName: 'Blog Post',
  baseType: '_page',
  isContract: false,
  properties: {
    title: { type: 'string' },
    author: { type: 'string' },
    relatedPosts: {
      type: 'array',
      items: { type: 'contentReference', allowedTypes: ['BlogPost'] },
    },
  },
};

const mockComponent: ContentType = {
  key: 'HeroComponent',
  displayName: 'Hero Component',
  baseType: '_component',
  isContract: false,
  compositionBehaviors: ['sectionEnabled'],
  properties: {
    heading: { type: 'string' },
    backgroundImage: { type: 'contentReference', allowedTypes: ['_image'] },
  },
};

const mockDisplayTemplate: DisplayTemplate = {
  key: 'ArticlePageTemplate',
  displayName: 'Article Page Template',
  contentType: 'ArticlePage',
  settings: {
    layout: {
      editor: 'select',
      choices: {
        wide: { displayName: 'Wide Layout' },
        narrow: { displayName: 'Narrow Layout' },
      },
    },
  },
};

const mockManifest: Manifest = {
  contentTypes: [mockContract, mockContentType, mockContentTypeWithContract, mockComponent],
  displayTemplates: [mockDisplayTemplate],
};

describe('generateCode', () => {
  it('should generate code for a contract', () => {
    const result = generateCode(mockContract, mockManifest, false);
    expect(result).toMatchInlineSnapshot(`
      "import { contract } from '@optimizely/cms-sdk';

      /**
       * SEO Contract
       */
      export const SEOContract = contract({
        key: 'SEOContract',
        displayName: 'SEO Contract',
        properties: {
          metaTitle: {
            type: 'string'
          },
          metaDescription: {
            type: 'string'
          }
        }
      });
      "
    `);
  });

  it('should generate code for a content type', () => {
    const result = generateCode(mockContentType, mockManifest, false);
    expect(result).toMatchInlineSnapshot(`
      "import { contentType } from '@optimizely/cms-sdk';

      /**
       * Article Page
       */
      export const ArticlePageCT = contentType({
        key: 'ArticlePage',
        displayName: 'Article Page',
        baseType: '_page',
        mayContainTypes: [
          'HeroComponent'
        ],
        properties: {
          heading: {
            type: 'string'
          },
          body: {
            type: 'richText'
          }
        }
      });
      "
    `);
  });

  it('should generate code for a display template', () => {
    const result = generateCode(mockDisplayTemplate, mockManifest, false);
    expect(result).toMatchInlineSnapshot(`
      "import { displayTemplate } from '@optimizely/cms-sdk';

      /**
       * Article Page Template
       */
      export const ArticlePageTemplateDT = displayTemplate({
        key: 'ArticlePageTemplate',
        displayName: 'Article Page Template',
        contentType: 'ArticlePage',
        settings: {
          layout: {
            editor: 'select',
            choices: {
              wide: {
                displayName: 'Wide Layout'
              },
              narrow: {
                displayName: 'Narrow Layout'
              }
            }
          }
        }
      });
      "
    `);
  });

  it('should filter out properties with default values', () => {
    const contentTypeWithDefaults: ContentType = {
      key: 'TestPage',
      displayName: 'Test Page',
      baseType: '_page',
      isContract: false,
      properties: {
        title: { type: 'string', isLocalized: false, isRequired: false, sortOrder: 0 },
        description: { type: 'string', isLocalized: true, isRequired: true, sortOrder: 1 },
      },
    };

    const result = generateCode(contentTypeWithDefaults, mockManifest, false);
    expect(result).toContain('isLocalized: true');
    expect(result).toContain('isRequired: true');
    expect(result).toContain('sortOrder: 1');
    expect(result).not.toContain('isLocalized: false');
    expect(result).not.toContain('isRequired: false');
    expect(result).not.toContain('sortOrder: 0');
  });
});

describe('generateFilePath', () => {
  it('should generate file path without grouping', () => {
    const result = generateFilePath(mockContentType, '/output', false);
    expect(result).toBe(join('/output', 'ArticlePageCT.ts'));
  });

  it('should generate file path with grouping for content type', () => {
    const result = generateFilePath(mockContentType, '/output', true);
    expect(result).toBe(join('/output', 'page', 'ArticlePageCT.ts'));
  });

  it('should generate file path with grouping for component', () => {
    const result = generateFilePath(mockComponent, '/output', true);
    expect(result).toBe(join('/output', 'component', 'HeroComponentCT.ts'));
  });

  it('should generate file path with grouping for contract', () => {
    const result = generateFilePath(mockContract, '/output', true);
    expect(result).toBe(join('/output', 'contract', 'SEOContract.ts'));
  });

  it('should generate file path with grouping for display template', () => {
    const result = generateFilePath(mockDisplayTemplate, '/output', true);
    expect(result).toBe(join('/output', 'displayTemplates', 'ArticlePageTemplateDT.ts'));
  });
});

describe('generateGroups', () => {
  it('should return unique group names from content array', () => {
    const contents = [mockContract, mockContentType, mockComponent, mockDisplayTemplate];
    const result = generateGroups(contents);
    expect(result).toEqual(['contract', 'page', 'component', 'displayTemplates']);
  });

  it('should handle empty array', () => {
    const result = generateGroups([]);
    expect(result).toEqual([]);
  });

  it('should deduplicate group names', () => {
    const contents = [mockContentType, mockContentTypeWithContract];
    const result = generateGroups(contents);
    expect(result).toEqual(['page']);
  });
});

describe('generateCode - edge cases', () => {
  it('should handle content type with imports to other content types', () => {
    const contentTypeWithImport: ContentType = {
      key: 'PageWithHero',
      displayName: 'Page With Hero',
      baseType: '_page',
      isContract: false,
      properties: {
        hero: { type: 'contentReference', allowedTypes: ['HeroComponent'] },
      },
    };

    const result = generateCode(contentTypeWithImport, mockManifest, false);
    expect(result).toContain("import { HeroComponentCT } from './HeroComponentCT'");
    expect(result).toContain('HeroComponentCT');
    expect(result).toContain('allowedTypes:');
  });

  it('should handle content type with imports when using grouping', () => {
    const contentTypeWithImport: ContentType = {
      key: 'PageWithHero',
      displayName: 'Page With Hero',
      baseType: '_page',
      isContract: false,
      properties: {
        hero: { type: 'contentReference', allowedTypes: ['HeroComponent'] },
      },
    };

    const result = generateCode(contentTypeWithImport, mockManifest, true);
    expect(result).toContain("import { HeroComponentCT } from '../component/HeroComponentCT'");
  });

  it('should not import system types (starting with _)', () => {
    const result = generateCode(mockComponent, mockManifest, false);
    expect(result).not.toContain('import { _image }');
    expect(result).toContain("'_image'");
  });

  it('should handle content type with special characters in key', () => {
    const contentTypeWithSpecialChars: ContentType = {
      key: 'My-Special@Page!',
      displayName: 'My Special Page',
      baseType: '_page',
      isContract: false,
      properties: {},
    };

    const result = generateCode(contentTypeWithSpecialChars, mockManifest, false);
    expect(result).toContain('export const MySpecialPageCT');
  });

  it('should not add suffix if key already contains it', () => {
    const contentTypeWithSuffix: ContentType = {
      key: 'MyPageCT',
      displayName: 'My Page CT',
      baseType: '_page',
      isContract: false,
      properties: {},
    };

    const result = generateCode(contentTypeWithSuffix, mockManifest, false);
    expect(result).toContain('export const MyPageCT =');
    expect(result).not.toContain('MyPageCTCT');
  });

  it('should handle contract with suffix in name', () => {
    const contractWithSuffix: ContentType = {
      key: 'MyContract',
      displayName: 'My Contract',
      isContract: true,
      properties: {},
    };

    const result = generateCode(contractWithSuffix, mockManifest, false);
    expect(result).toContain('export const MyContract =');
    expect(result).not.toContain('MyContractContract');
  });

  it('should handle content type with empty properties', () => {
    const contentTypeNoProps: ContentType = {
      key: 'EmptyPage',
      displayName: 'Empty Page',
      baseType: '_page',
      isContract: false,
      properties: {},
    };

    const result = generateCode(contentTypeNoProps, mockManifest, false);
    expect(result).not.toContain('properties:');
  });

  it('should escape comment content with closing comment syntax', () => {
    const contentTypeWithCommentChars: ContentType = {
      key: 'TestPage',
      displayName: 'Test */ Page',
      baseType: '_page',
      isContract: false,
      properties: {},
    };

    const result = generateCode(contentTypeWithCommentChars, mockManifest, false);
    expect(result).toContain('Test *\\/ Page');
  });

  it('should filter out empty array properties', () => {
    const contentTypeWithEmptyArrays: ContentType = {
      key: 'TestPage',
      displayName: 'Test Page',
      baseType: '_page',
      isContract: false,
      mayContainTypes: [],
      compositionBehaviors: [],
      properties: {},
    };

    const result = generateCode(contentTypeWithEmptyArrays, mockManifest, false);
    expect(result).not.toContain('mayContainTypes:');
    expect(result).not.toContain('compositionBehaviors:');
  });

  it('should handle display template with nodeType', () => {
    const templateWithNodeType: DisplayTemplate = {
      key: 'CustomTemplate',
      displayName: 'Custom Template',
      contentType: 'ArticlePage',
      nodeType: 'row',
      settings: {},
    };

    const result = generateCode(templateWithNodeType, mockManifest, false);
    expect(result).toContain("nodeType: 'row'");
  });

  it('should handle content type with multiple imports from same group', () => {
    const pageWithMultipleComponents: ContentType = {
      key: 'RichPage',
      displayName: 'Rich Page',
      baseType: '_page',
      isContract: false,
      properties: {
        hero: { type: 'contentReference', allowedTypes: ['HeroComponent'] },
        relatedContent: {
          type: 'array',
          items: { type: 'contentReference', allowedTypes: ['HeroComponent'] },
        },
      },
    };

    const result = generateCode(pageWithMultipleComponents, mockManifest, false);
    // Should only import HeroComponent once
    const importMatches = result.match(/import.*HeroComponentCT/g);
    expect(importMatches).toHaveLength(1);
  });
});

describe('generateFilePath - edge cases', () => {
  it('should handle content type without baseType', () => {
    const contentTypeNoBase: ContentType = {
      key: 'GenericContent',
      displayName: 'Generic Content',
      isContract: false,
      properties: {},
    };

    const result = generateFilePath(contentTypeNoBase, '/output', true);
    expect(result).toBe(join('/output', '', 'GenericContentCT.ts'));
  });

  it('should handle special characters in output directory', () => {
    const result = generateFilePath(mockContentType, '/my output/types', false);
    expect(result).toBe(join('/my output/types', 'ArticlePageCT.ts'));
  });
});
