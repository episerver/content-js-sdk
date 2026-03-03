import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  generateDisplayTemplateFiles,
  generateDisplayTemplateCode,
} from '../generators/displayTemplateGenerator.js';
import { DisplayTemplate } from '../generators/manifest.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('generateDisplayTemplateFiles', () => {
  const outputDir = path.join(__dirname, 'tmp');
  const displayTemplates: DisplayTemplate[] = [
    {
      key: 'TestTemplate',
      displayName: 'Test Template',
      contentType: 'TestType', // Required discriminator
    },
  ];

  beforeAll(async () => {
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('should generate a file for each display template', async () => {
    const files = await generateDisplayTemplateFiles(
      displayTemplates,
      outputDir,
    );
    expect(files).toHaveLength(1);
    const filePath = path.join(outputDir, files[0]);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('displayTemplate');
    expect(content).toContain('TestTemplate');
  });

  it('should throw error for display template key with no alphanumeric characters', async () => {
    const invalidDisplayTemplates: DisplayTemplate[] = [
      {
        key: '@@@',
        displayName: 'Invalid Template',
        contentType: 'TestType',
      },
    ];

    await expect(
      generateDisplayTemplateFiles(invalidDisplayTemplates, outputDir),
    ).rejects.toThrow(
      'Invalid display template key "@@@": must contain at least one alphanumeric character',
    );
  });
});

describe('generateDisplayTemplateCode', () => {
  it('should generate TypeScript code for a display template', () => {
    const displayTemplate: DisplayTemplate = {
      key: 'SampleTemplate',
      displayName: 'Sample Template',
      contentType: 'SampleType', // Required discriminator
    };
    const code = generateDisplayTemplateCode(displayTemplate);
    expect(code).toContain('displayTemplate');
    expect(code).toContain('SampleTemplate');
  });

  it('should properly escape special characters in strings', () => {
    const displayTemplate: DisplayTemplate = {
      key: "Template'Key",
      displayName: "Template with 'quotes' and \\backslash",
      contentType: "Type'With'Quotes",
    };
    const code = generateDisplayTemplateCode(displayTemplate);

    // Generated code should be valid TypeScript (no unescaped quotes breaking the syntax)
    expect(code).toContain("key: 'Template\\'Key'");
    expect(code).toContain("displayName: 'Template with \\'quotes\\' and \\\\backslash'");
    expect(code).toContain("contentType: 'Type\\'With\\'Quotes'");
  });

  it('should throw error for display template key with no alphanumeric characters', () => {
    const displayTemplate: DisplayTemplate = {
      key: '___',
      displayName: 'Invalid Template',
      baseType: '_page',
    };

    expect(() => generateDisplayTemplateCode(displayTemplate)).toThrow(
      'Invalid display template key "___": must contain at least one alphanumeric character',
    );
  });
});
