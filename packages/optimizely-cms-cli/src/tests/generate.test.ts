import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import {
  generateContentCode,
  generateFilePath,
  generateGroups,
  generateManifestCode,
} from '../utils/generate.js';
import {
  Manifest,
  ManifestContentType,
  ManifestDisplayTemplate,
} from '../utils/manifest.js';

const mockContract: ManifestContentType = {
  key: 'SEOContract',
  displayName: 'SEO Contract',
  isContract: true,
  properties: {
    metaTitle: { type: 'string' },
    metaDescription: { type: 'string' },
  },
};

const mockContentType: ManifestContentType = {
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

const mockContentTypeWithContract: ManifestContentType = {
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

const mockComponent: ManifestContentType = {
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

const mockDisplayTemplate: ManifestDisplayTemplate = {
  key: 'ArticlePageTemplate',
  displayName: 'Article Page Template',
  isDefault: false,
  settings: {
    layout: {
      displayName: 'layout',
      sortOrder: 0,
      editor: 'select',
      choices: {
        wide: { displayName: 'Wide Layout', sortOrder: 0 },
        narrow: { displayName: 'Narrow Layout', sortOrder: 0 },
      },
    },
  },
};

const mockManifest: Manifest = {
  contentTypes: [
    mockContract,
    mockContentType,
    mockContentTypeWithContract,
    mockComponent,
  ],
  displayTemplates: [mockDisplayTemplate],
};

describe('generateContentCode', () => {
  it('should generate code for a contract', () => {
    const result = generateContentCode(mockContract, mockManifest, false, new Map());
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
    const result = generateContentCode(mockContentType, mockManifest, false, new Map());
    expect(result).toMatchInlineSnapshot(`
      "import { contentType } from '@optimizely/cms-sdk';
      import { HeroComponentCT } from './HeroComponentCT';

      /**
       * Article Page
       */
      export const ArticlePageCT = contentType({
        key: 'ArticlePage',
        displayName: 'Article Page',
        baseType: '_page',
        mayContainTypes: [
          HeroComponentCT
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
    const result = generateContentCode(mockDisplayTemplate, mockManifest, false);
    expect(result).toMatchInlineSnapshot(`
      "import { displayTemplate } from '@optimizely/cms-sdk';

      /**
       * Article Page Template
       */
      export const ArticlePageTemplateDT = displayTemplate({
        key: 'ArticlePageTemplate',
        isDefault: false,
        displayName: 'Article Page Template',
        settings: {
          layout: {
            displayName: 'layout',
            sortOrder: 0,
            editor: 'select',
            choices: {
              wide: {
                displayName: 'Wide Layout',
                sortOrder: 0
              },
              narrow: {
                displayName: 'Narrow Layout',
                sortOrder: 0
              }
            }
          }
        }
      });
      "
    `);
  });

  it('should filter out properties with default values', () => {
    const contentTypeWithDefaults: ManifestContentType = {
      key: 'TestPage',
      displayName: 'Test Page',
      baseType: '_page',
      isContract: false,
      properties: {
        title: { type: 'string', isLocalized: false, isRequired: false, sortOrder: 0 },
        description: {
          type: 'string',
          isLocalized: true,
          isRequired: true,
          sortOrder: 1,
        },
      },
    };

    const result = generateContentCode(contentTypeWithDefaults, mockManifest, false);
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

describe('generateContentCode - edge cases', () => {
  it('should handle content type with imports to other content types', () => {
    const contentTypeWithImport: ManifestContentType = {
      key: 'PageWithHero',
      displayName: 'Page With Hero',
      baseType: '_page',
      isContract: false,
      properties: {
        hero: { type: 'contentReference', allowedTypes: ['HeroComponent'] },
      },
    };

    const result = generateContentCode(contentTypeWithImport, mockManifest, false);
    expect(result).toContain("import { HeroComponentCT } from './HeroComponentCT'");
    expect(result).toContain('HeroComponentCT');
    expect(result).toContain('allowedTypes:');
  });

  it('should handle content type with imports when using grouping', () => {
    const contentTypeWithImport: ManifestContentType = {
      key: 'PageWithHero',
      displayName: 'Page With Hero',
      baseType: '_page',
      isContract: false,
      properties: {
        hero: { type: 'contentReference', allowedTypes: ['HeroComponent'] },
      },
    };

    const result = generateContentCode(contentTypeWithImport, mockManifest, true);
    expect(result).toContain(
      "import { HeroComponentCT } from '../component/HeroComponentCT'",
    );
  });

  it('should not import system types (starting with _)', () => {
    const result = generateContentCode(mockComponent, mockManifest, false);
    expect(result).not.toContain('import { _image }');
    expect(result).toContain("'_image'");
  });

  it('should handle content type with special characters in key', () => {
    const contentTypeWithSpecialChars: ManifestContentType = {
      key: 'My-Special@Page!',
      displayName: 'My Special Page',
      baseType: '_page',
      isContract: false,
      properties: {},
    };

    const result = generateContentCode(contentTypeWithSpecialChars, mockManifest, false);
    expect(result).toContain('export const MySpecialPageCT');
  });

  it('should not add suffix if key already contains it', () => {
    const contentTypeWithSuffix: ManifestContentType = {
      key: 'MyPageCT',
      displayName: 'My Page CT',
      baseType: '_page',
      isContract: false,
      properties: {},
    };

    const result = generateContentCode(contentTypeWithSuffix, mockManifest, false);
    expect(result).toContain('export const MyPageCT =');
    expect(result).not.toContain('MyPageCTCT');
  });

  it('should handle contract with suffix in name', () => {
    const contractWithSuffix: ManifestContentType = {
      key: 'MyContract',
      displayName: 'My Contract',
      isContract: true,
      properties: {},
    };

    const result = generateContentCode(contractWithSuffix, mockManifest, false);
    expect(result).toContain('export const MyContract =');
    expect(result).not.toContain('MyContractContract');
  });

  it('should handle content type with empty properties', () => {
    const contentTypeNoProps: ManifestContentType = {
      key: 'EmptyPage',
      displayName: 'Empty Page',
      baseType: '_page',
      isContract: false,
      properties: {},
    };

    const result = generateContentCode(contentTypeNoProps, mockManifest, false);
    expect(result).not.toContain('properties:');
  });

  it('should escape comment content with closing comment syntax', () => {
    const contentTypeWithCommentChars: ManifestContentType = {
      key: 'TestPage',
      displayName: 'Test */ Page',
      baseType: '_page',
      isContract: false,
      properties: {},
    };

    const result = generateContentCode(contentTypeWithCommentChars, mockManifest, false);
    expect(result).toContain('Test *\\/ Page');
  });

  it('should filter out empty array properties', () => {
    const contentTypeWithEmptyArrays: ManifestContentType = {
      key: 'TestPage',
      displayName: 'Test Page',
      baseType: '_page',
      isContract: false,
      mayContainTypes: [],
      compositionBehaviors: [],
      properties: {},
    };

    const result = generateContentCode(contentTypeWithEmptyArrays, mockManifest, false);
    expect(result).not.toContain('mayContainTypes:');
    expect(result).not.toContain('compositionBehaviors:');
  });

  it('should handle display template with nodeType', () => {
    const templateWithNodeType: ManifestDisplayTemplate = {
      key: 'CustomTemplate',
      displayName: 'Custom Template',
      isDefault: false,
      nodeType: 'row',
    };

    const result = generateContentCode(templateWithNodeType, mockManifest, false);
    expect(result).toContain("nodeType: 'row'");
  });

  it('should preserve double quotes in string values (not convert to escaped single quotes)', () => {
    const contentTypeWithQuotedDesc: ManifestContentType = {
      key: 'EventPage',
      displayName: 'Event Page',
      baseType: '_page',
      isContract: false,
      properties: {
        StartTime: {
          type: 'dateTime',
          displayName: 'Starttid',
          description: 'She said, "What a beautiful day!"',
        } as any,
      },
    };

    const result = generateContentCode(contentTypeWithQuotedDesc, mockManifest, false);
    expect(result).toContain(`'She said, "What a beautiful day!"'`);
    expect(result).not.toContain(`\\'What a beautiful day\\'`);
  });

  it('should escape literal single quotes in string values', () => {
    const contentTypeWithSingleQuoteDesc: ManifestContentType = {
      key: 'EventPage',
      displayName: 'Event Page',
      baseType: '_page',
      isContract: false,
      properties: {
        Info: {
          type: 'string',
          description: "it's a beautiful day",
        } as any,
      },
    };

    const result = generateContentCode(
      contentTypeWithSingleQuoteDesc,
      mockManifest,
      false,
    );
    expect(result).toContain(`'it\\'s a beautiful day'`);
  });

  it('should handle content type with multiple imports from same group', () => {
    const pageWithMultipleComponents: ManifestContentType = {
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

    const result = generateContentCode(pageWithMultipleComponents, mockManifest, false);
    // Should only import HeroComponent once
    const importMatches = result.match(/import.*HeroComponentCT/g);
    expect(importMatches).toHaveLength(1);
  });

  it('should replace self-references with _self', () => {
    const selfReferencingContent: ManifestContentType = {
      key: 'FolderPage',
      displayName: 'Folder Page',
      baseType: '_page',
      isContract: false,
      mayContainTypes: ['FolderPage', 'ArticlePage'],
      properties: {
        relatedFolders: {
          type: 'array',
          items: { type: 'contentReference', allowedTypes: ['FolderPage'] },
        },
      },
    };

    const manifest: Manifest = {
      contentTypes: [selfReferencingContent, mockContentType],
      displayTemplates: [],
    };

    const result = generateContentCode(selfReferencingContent, manifest, false);
    expect(result).toContain("'_self'");
    expect(result).toMatch(/mayContainTypes:\s*\[\s*'_self'/);
    expect(result).toMatch(/allowedTypes:\s*\[\s*'_self'/);
    expect(result).toContain('ArticlePageCT');
    expect(result).toMatch(/export const FolderPageCT = contentType/);
    expect(result).toContain("import { ArticlePageCT } from './ArticlePageCT'");
  });
});

describe('generateFilePath - edge cases', () => {
  it('should handle content type without baseType', () => {
    const contentTypeNoBase: ManifestContentType = {
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

describe('generateManifestCode', () => {
  it('should generate manifest code with all content types', () => {
    const simpleManifest: Manifest = {
      contentTypes: [mockContentType, mockContract],
      displayTemplates: [],
    };

    const result = generateManifestCode(simpleManifest);
    expect(result).toContain("from '@optimizely/cms-sdk'");
    expect(result).toContain('contract');
    expect(result).toContain('contentType');
    expect(result).toContain('export const SEOContract');
    expect(result).toContain('export const ArticlePageCT');
  });

  it('should sort content types by dependencies', () => {
    const dependency: ManifestContentType = {
      key: 'BaseContent',
      displayName: 'Base Content',
      baseType: '_page',
      isContract: false,
      properties: {},
    };

    const consumer: ManifestContentType = {
      key: 'PageWithBase',
      displayName: 'Page With Base',
      baseType: '_page',
      isContract: false,
      properties: {
        baseRef: { type: 'contentReference', allowedTypes: ['BaseContent'] },
      },
    };

    // Create manifest with consumer first, then dependency
    const manifest: Manifest = {
      contentTypes: [consumer, dependency],
      displayTemplates: [],
    };

    const result = generateManifestCode(manifest);

    // BaseContent should appear before PageWithBase in the output
    const baseIndex = result.indexOf('export const BaseContentCT');
    const consumerIndex = result.indexOf('export const PageWithBaseCT');
    expect(baseIndex).toBeGreaterThan(-1);
    expect(consumerIndex).toBeGreaterThan(-1);
    expect(baseIndex).toBeLessThan(consumerIndex);
  });

  it('should handle complex dependency chains', () => {
    const level1: ManifestContentType = {
      key: 'Level1',
      displayName: 'Level 1',
      baseType: '_component',
      isContract: false,
      properties: {},
    };

    const level2: ManifestContentType = {
      key: 'Level2',
      displayName: 'Level 2',
      baseType: '_component',
      isContract: false,
      properties: {
        child: { type: 'contentReference', allowedTypes: ['Level1'] },
      },
    };

    const level3: ManifestContentType = {
      key: 'Level3',
      displayName: 'Level 3',
      baseType: '_page',
      isContract: false,
      properties: {
        children: {
          type: 'array',
          items: { type: 'contentReference', allowedTypes: ['Level2', 'Level1'] },
        },
      },
    };

    // Create manifest in reverse order
    const manifest: Manifest = {
      contentTypes: [level3, level2, level1],
      displayTemplates: [],
    };

    const result = generateManifestCode(manifest);

    const level1Index = result.indexOf('export const Level1CT');
    const level2Index = result.indexOf('export const Level2CT');
    const level3Index = result.indexOf('export const Level3CT');

    // Level1 should come before Level2, and Level2 before Level3
    expect(level1Index).toBeLessThan(level2Index);
    expect(level2Index).toBeLessThan(level3Index);
  });

  it('should handle circular dependencies gracefully', () => {
    const contentA: ManifestContentType = {
      key: 'ContentA',
      displayName: 'Content A',
      baseType: '_page',
      isContract: false,
      properties: {
        refB: { type: 'contentReference', allowedTypes: ['ContentB'] },
      },
    };

    const contentB: ManifestContentType = {
      key: 'ContentB',
      displayName: 'Content B',
      baseType: '_page',
      isContract: false,
      properties: {
        refA: { type: 'contentReference', allowedTypes: ['ContentA'] },
      },
    };

    const manifest: Manifest = {
      contentTypes: [contentA, contentB],
      displayTemplates: [],
    };

    const result = generateManifestCode(manifest);

    // Should use string literals for circular references
    expect(result).toContain("allowedTypes: [\n        'ContentB'\n      ]");
    expect(result).toContain("allowedTypes: [\n        'ContentA'\n      ]");

    // Should NOT import each other
    expect(result).not.toContain('import { ContentACT }');
    expect(result).not.toContain('import { ContentBCT }');

    // Should still generate both exports
    expect(result).toContain('export const ContentACT');
    expect(result).toContain('export const ContentBCT');
  });

  it('should use imports for non-circular references', () => {
    const parent: ManifestContentType = {
      key: 'ParentPage',
      displayName: 'Parent Page',
      baseType: '_page',
      isContract: false,
      mayContainTypes: ['ChildComponent'],
      properties: {},
    };

    const child: ManifestContentType = {
      key: 'ChildComponent',
      displayName: 'Child Component',
      baseType: '_component',
      isContract: false,
      properties: {},
    };

    const manifest: Manifest = {
      contentTypes: [parent, child],
      displayTemplates: [],
    };

    const result = generateManifestCode(manifest);

    // Non-circular reference should use import (not string literal)
    expect(result).toContain('mayContainTypes: [\n    ChildComponentCT\n  ]');
  });

  it('should handle transitive circular dependencies', () => {
    const a: ManifestContentType = {
      key: 'A',
      displayName: 'A',
      baseType: '_page',
      isContract: false,
      properties: { ref: { type: 'contentReference', allowedTypes: ['B'] } },
    };

    const b: ManifestContentType = {
      key: 'B',
      displayName: 'B',
      baseType: '_page',
      isContract: false,
      properties: { ref: { type: 'contentReference', allowedTypes: ['C'] } },
    };

    const c: ManifestContentType = {
      key: 'C',
      displayName: 'C',
      baseType: '_page',
      isContract: false,
      properties: { ref: { type: 'contentReference', allowedTypes: ['A'] } },
    };

    const manifest: Manifest = { contentTypes: [a, b, c], displayTemplates: [] };
    const result = generateManifestCode(manifest);

    // All references in the cycle should use strings
    expect(result).toContain("allowedTypes: [\n        'B'\n      ]");
    expect(result).toContain("allowedTypes: [\n        'C'\n      ]");
    expect(result).toContain("allowedTypes: [\n        'A'\n      ]");
  });

  it('should include display templates in manifest', () => {
    const manifest: Manifest = {
      contentTypes: [mockContentType],
      displayTemplates: [mockDisplayTemplate],
    };

    const result = generateManifestCode(manifest);
    expect(result).toContain("from '@optimizely/cms-sdk'");
    expect(result).toContain('contentType');
    expect(result).toContain('displayTemplate');
    expect(result).toContain('export const ArticlePageCT');
    expect(result).toContain('export const ArticlePageTemplateDT');
  });

  it('should remove unresolved import markers for content types not in manifest', () => {
    const pageWithSystemTypeRef: ManifestContentType = {
      key: 'NewsPage',
      displayName: 'News Page',
      baseType: '_page',
      isContract: false,
      mayContainTypes: ['SysContentFolder', 'PageListBlock'],
      properties: {},
    };

    const pageListBlock: ManifestContentType = {
      key: 'PageListBlock',
      displayName: 'Page List Block',
      baseType: '_component',
      isContract: false,
      properties: {},
    };

    // Manifest only contains PageListBlock, not SysContentFolder (simulates filtering)
    const manifest: Manifest = {
      contentTypes: [pageWithSystemTypeRef, pageListBlock],
      displayTemplates: [],
    };

    const result = generateManifestCode(manifest);

    // Should not contain any unresolved import markers like '<|SysContentFolder|>'
    expect(result).not.toMatch(/<\|.*?\|>/);

    // Should contain resolved reference to PageListBlock
    expect(result).toContain('PageListBlockCT');

    // Should handle missing SysContentFolder gracefully (either removed or kept as string)
    expect(result).not.toContain('<|SysContentFolder|>');
  });
});
