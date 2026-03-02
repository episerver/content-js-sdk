import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  generateContentTypeFiles,
  generateContentTypeCode,
} from '../generators/contentTypeGenerator.js';
import { ContentType } from '../generators/manifest.js';
import fs from 'fs/promises';
import path from 'path';

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
});
