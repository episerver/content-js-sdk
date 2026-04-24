import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  generateContentTypeFiles,
  generateContentTypeCode,
  cleanKey,
} from '../generators/contentTypeGenerator.js';
import { ContentType } from '../generators/manifest.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('generateContentTypeFiles', () => {
  const outputDir = path.join(__dirname, 'tmp');
  const contentTypes: ContentType[] = [
    {
      key: 'TestType',
      baseType: '_component',
      displayName: 'Test Type',
      properties: { title: { type: 'string' } },
    },
  ];
  const displayTemplatesByContentType = new Map();

  beforeAll(async () => {
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('should generate a file for each content type', async () => {
    const files = await generateContentTypeFiles(
      contentTypes,
      displayTemplatesByContentType,
      outputDir,
    );
    expect(files).toHaveLength(1);
    const filePath = path.join(outputDir, files[0]);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('contentType');
    expect(content).toContain('TestType');
  });

  it('should throw error for content type key with no alphanumeric characters', async () => {
    const invalidContentTypes: ContentType[] = [
      {
        key: '***',
        baseType: '_component',
        displayName: 'Invalid Type',
        properties: {},
      },
    ];

    await expect(
      generateContentTypeFiles(
        invalidContentTypes,
        displayTemplatesByContentType,
        outputDir,
      ),
    ).rejects.toThrow(
      'Invalid key "***": must contain at least one alphanumeric character',
    );
  });
});

describe('cleanKey', () => {
  it('should remove hyphens from keys', () => {
    expect(cleanKey('Hero-Component')).toBe('HeroComponent');
  });

  it('should preserve underscores in keys', () => {
    expect(cleanKey('Hero_Component')).toBe('Hero_Component');
  });

  it('should remove hyphens but preserve underscores', () => {
    expect(cleanKey('Hero-Component_Block')).toBe('HeroComponent_Block');
  });

  it('should preserve alphanumeric characters', () => {
    expect(cleanKey('Hero123Component')).toBe('Hero123Component');
  });

  it('should distinguish between Hero-Component and Hero_Component', () => {
    // These should generate different identifiers to avoid collision
    expect(cleanKey('Hero-Component')).toBe('HeroComponent');
    expect(cleanKey('Hero_Component')).toBe('Hero_Component');
    expect(cleanKey('Hero-Component')).not.toBe(cleanKey('Hero_Component'));
  });

  it('should throw error for keys with no alphanumeric characters', () => {
    expect(() => cleanKey('***')).toThrow(
      'Invalid key "***": must contain at least one alphanumeric character'
    );
  });

  it('should throw error for keys with only special characters (no alphanumeric)', () => {
    expect(() => cleanKey('---___')).toThrow(
      'Invalid key "---___": must contain at least one alphanumeric character'
    );
  });

  it('should preserve case sensitivity', () => {
    expect(cleanKey('Hero_component')).toBe('Hero_component');
    expect(cleanKey('Hero_Component')).toBe('Hero_Component');
    expect(cleanKey('Hero_component')).not.toBe(cleanKey('Hero_Component'));
  });
});

describe('generateContentTypeCode', () => {
  it('should generate TypeScript code for a content type', () => {
    const contentType: ContentType = {
      key: 'SampleType',
      baseType: '_component',
      displayName: 'Sample Type',
      properties: { title: { type: 'string' } },
    };
    const code = generateContentTypeCode(contentType);
    expect(code).toContain('contentType');
    expect(code).toContain('SampleType');
  });

  it('should properly escape special characters in strings', () => {
    const contentType: ContentType = {
      key: "Test'Type",
      baseType: '_component',
      displayName: "Type with 'quotes' and \\backslash",
      properties: {
        title: {
          type: 'string',
          displayName: "Title with 'single quotes'",
          description: "Description with\nnewline and 'quotes'",
        },
      },
      mayContainTypes: ["Type'With'Quotes"],
    };
    const code = generateContentTypeCode(contentType);

    // Generated code should be valid TypeScript (no unescaped quotes breaking the syntax)
    expect(code).toContain("key: 'Test\\'Type'");
    expect(code).toContain("displayName: 'Type with \\'quotes\\' and \\\\backslash'");
    expect(code).toContain("displayName: 'Title with \\'single quotes\\''");
    expect(code).toContain("description: 'Description with\\nnewline and \\'quotes\\''");
    expect(code).toContain("mayContainTypes: ['Type\\'With\\'Quotes']");
  });

  it('should throw error for content type key with no alphanumeric characters', () => {
    const contentType: ContentType = {
      key: '---',
      baseType: '_component',
      displayName: 'Invalid Type',
      properties: {},
    };

    expect(() => generateContentTypeCode(contentType)).toThrow(
      'Invalid key "---": must contain at least one alphanumeric character',
    );
  });

  describe('enum normalization', () => {
    it('should handle SDK format (direct array) for string enums', () => {
      const contentType: ContentType = {
        key: 'EnumTest',
        baseType: '_component',
        displayName: 'Enum Test',
        properties: {
          theme: {
            type: 'string',
            enum: [
              { value: 'light', displayName: 'Light Theme' },
              { value: 'dark', displayName: 'Dark Theme' },
            ],
          },
        },
      };
      const code = generateContentTypeCode(contentType);
      expect(code).toContain("{ value: 'light', displayName: 'Light Theme' }");
      expect(code).toContain("{ value: 'dark', displayName: 'Dark Theme' }");
    });

    it('should handle manifest format (wrapped array) for string enums', () => {
      const contentType: ContentType = {
        key: 'EnumTest',
        baseType: '_component',
        displayName: 'Enum Test',
        properties: {
          theme: {
            type: 'string',
            enum: {
              values: [
                { value: 'light', displayName: 'Light Theme' },
                { value: 'dark', displayName: 'Dark Theme' },
              ],
            },
          },
        },
      };
      const code = generateContentTypeCode(contentType);
      expect(code).toContain("{ value: 'light', displayName: 'Light Theme' }");
      expect(code).toContain("{ value: 'dark', displayName: 'Dark Theme' }");
    });

    it('should handle OpenAPI format (object map) for string enums', () => {
      const contentType: ContentType = {
        key: 'EnumTest',
        baseType: '_component',
        displayName: 'Enum Test',
        properties: {
          theme: {
            type: 'string',
            enum: {
              values: {
                light: 'Light Theme',
                dark: 'Dark Theme',
              },
            },
          },
        },
      };
      const code = generateContentTypeCode(contentType);
      expect(code).toContain("{ value: 'light', displayName: 'Light Theme' }");
      expect(code).toContain("{ value: 'dark', displayName: 'Dark Theme' }");
    });

    it('should handle SDK format (direct array) for integer enums', () => {
      const contentType: ContentType = {
        key: 'EnumTest',
        baseType: '_component',
        displayName: 'Enum Test',
        properties: {
          priority: {
            type: 'integer',
            enum: [
              { value: 1, displayName: 'Low' },
              { value: 2, displayName: 'Medium' },
              { value: 3, displayName: 'High' },
            ],
          },
        },
      };
      const code = generateContentTypeCode(contentType);
      expect(code).toContain("{ value: 1, displayName: 'Low' }");
      expect(code).toContain("{ value: 2, displayName: 'Medium' }");
      expect(code).toContain("{ value: 3, displayName: 'High' }");
    });

    it('should handle manifest format (wrapped array) for integer enums', () => {
      const contentType: ContentType = {
        key: 'EnumTest',
        baseType: '_component',
        displayName: 'Enum Test',
        properties: {
          priority: {
            type: 'integer',
            enum: {
              values: [
                { value: 1, displayName: 'Low' },
                { value: 2, displayName: 'Medium' },
                { value: 3, displayName: 'High' },
              ],
            },
          },
        },
      };
      const code = generateContentTypeCode(contentType);
      expect(code).toContain("{ value: 1, displayName: 'Low' }");
      expect(code).toContain("{ value: 2, displayName: 'Medium' }");
      expect(code).toContain("{ value: 3, displayName: 'High' }");
    });

    it('should handle OpenAPI format (object map) for integer enums', () => {
      const contentType: ContentType = {
        key: 'EnumTest',
        baseType: '_component',
        displayName: 'Enum Test',
        properties: {
          priority: {
            type: 'integer',
            enum: {
              values: {
                '1': 'Low',
                '2': 'Medium',
                '3': 'High',
              },
            },
          },
        },
      };
      const code = generateContentTypeCode(contentType);
      expect(code).toContain("{ value: 1, displayName: 'Low' }");
      expect(code).toContain("{ value: 2, displayName: 'Medium' }");
      expect(code).toContain("{ value: 3, displayName: 'High' }");
    });

    it('should handle float enums with OpenAPI format', () => {
      const contentType: ContentType = {
        key: 'EnumTest',
        baseType: '_component',
        displayName: 'Enum Test',
        properties: {
          rating: {
            type: 'float',
            enum: {
              values: {
                '1.5': 'Low',
                '2.5': 'Medium',
                '3.5': 'High',
              },
            },
          },
        },
      };
      const code = generateContentTypeCode(contentType);
      expect(code).toContain("{ value: 1.5, displayName: 'Low' }");
      expect(code).toContain("{ value: 2.5, displayName: 'Medium' }");
      expect(code).toContain("{ value: 3.5, displayName: 'High' }");
    });
  });

  describe('array properties', () => {
    it('should generate array with all metadata properties', () => {
      const contentType: ContentType = {
        key: 'ArrayTest',
        baseType: '_component',
        displayName: 'Array Test',
        properties: {
          p_string_list: {
            type: 'array',
            displayName: 'p_string_list testing',
            isLocalized: true,
            isRequired: false,
            group: 'Content',
            sortOrder: 0,
            minItems: 5,
            maxItems: 100,
            items: {
              type: 'string',
              format: 'shortString',
              maxLength: 100,
              pattern: '^p$*',
            },
          },
        },
      };
      const code = generateContentTypeCode(contentType);
      expect(code).toContain("type: 'array'");
      expect(code).toContain("displayName: 'p_string_list testing'");
      expect(code).toContain('isLocalized: true');
      expect(code).toContain("group: 'Content'");
      expect(code).toContain('sortOrder: 0');
      expect(code).toContain('minItems: 5');
      expect(code).toContain('maxItems: 100');
      expect(code).toContain("format: 'shortString'");
      expect(code).toContain('maxLength: 100');
      expect(code).toContain("pattern: '^p$*'");
    });

    it('should handle simple array without metadata', () => {
      const contentType: ContentType = {
        key: 'SimpleArray',
        baseType: '_component',
        displayName: 'Simple Array',
        properties: {
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      };
      const code = generateContentTypeCode(contentType);
      expect(code).toContain("type: 'array'");
      expect(code).toContain("type: 'string'");
      // Should not include optional properties
      expect(code).toContain('displayName:');
      expect(code).not.toContain('minItems:');
      expect(code).not.toContain('maxItems:');
    });
  });

  describe('grouped imports', () => {
    it('should generate correct relative import path for cross-group component references', () => {
      // Setup: Product (experience) referencing SEO (component)
      const contentTypeToGroupMap = new Map<string, string>([
        ['Product', 'experience'],
        ['SEO', 'component'],
      ]);

      const productContentType: ContentType = {
        key: 'Product',
        baseType: '_experience',
        displayName: 'Product Page',
        properties: {
          seo_properties: {
            type: 'component',
            contentType: 'SEO',
          },
        },
      };

      const code = generateContentTypeCode(
        productContentType,
        contentTypeToGroupMap,
        'experience',
      );

      // Should import from ../component/SEO.js, not ./SEO.js
      expect(code).toContain("import { SEOCT } from '../component/SEO.js';");
      expect(code).not.toContain("import { SEOCT } from './SEO.js';");
    });

    it('should generate same-directory import path for same-group component references', () => {
      // Setup: Hero (component) referencing Button (component)
      const contentTypeToGroupMap = new Map<string, string>([
        ['Hero', 'component'],
        ['Button', 'component'],
      ]);

      const heroContentType: ContentType = {
        key: 'Hero',
        baseType: '_component',
        displayName: 'Hero Component',
        properties: {
          button: {
            type: 'component',
            contentType: 'Button',
          },
        },
      };

      const code = generateContentTypeCode(
        heroContentType,
        contentTypeToGroupMap,
        'component',
      );

      // Should import from ./Button.js for same group
      expect(code).toContain("import { ButtonCT } from './Button.js';");
    });

    it('should generate same-directory import when no grouping is used', () => {
      // No contentTypeToGroupMap or currentGroup provided
      const contentType: ContentType = {
        key: 'Product',
        baseType: '_experience',
        displayName: 'Product',
        properties: {
          seo_properties: {
            type: 'component',
            contentType: 'SEO',
          },
        },
      };

      const code = generateContentTypeCode(contentType);

      // Should use default same-directory import
      expect(code).toContain("import { SEOCT } from './SEO.js';");
    });
  });
});
