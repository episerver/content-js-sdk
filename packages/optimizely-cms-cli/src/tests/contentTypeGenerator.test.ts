import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  generateContentTypeFiles,
  generateContentTypeCode,
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
      'Invalid content type key "***": must contain at least one alphanumeric character',
    );
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
      'Invalid content type key "---": must contain at least one alphanumeric character',
    );
  });
});
