import { describe, it, expect } from 'vitest';
import { mkdtemp, rm, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { join, dirname, basename, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { makeFile } from '../utils/make.js';
import { generateManifestCode, generateManifestFilePath } from '../utils/generate.js';
import { Manifest } from '../utils/manifest.js';

const mockManifest: Manifest = {
  contentTypes: [
    {
      key: 'ArticlePage',
      displayName: 'Article Page',
      baseType: '_page',
      isContract: false,
      properties: {
        heading: { type: 'string' },
        body: { type: 'richText' },
      },
    },
  ],
  displayTemplates: [],
};

const createTestFile = async (
  providedOutput: string,
  assertions: (tempDir: string, resolvedOutput: string) => Promise<void>,
) => {
  const tempDir = await mkdtemp(join(tmpdir(), 'cli-test-'));

  try {
    const resolvedOutput = resolve(tempDir, providedOutput);
    const isSingleFile = /\.tsx?$/.test(providedOutput);
    const outputDir = isSingleFile ? dirname(resolvedOutput) : resolvedOutput;
    const filePath = isSingleFile ? resolvedOutput : generateManifestFilePath(resolvedOutput);

    await mkdir(outputDir, { recursive: true });

    await makeFile({
      path: filePath,
      content: generateManifestCode(mockManifest),
    });

    await assertions(tempDir, resolvedOutput);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

describe('Pull command file output logic', () => {
  it('should create file at exact path when output ends with .ts', async () => {
    await createTestFile('./types.ts', async (tempDir, resolvedOutput) => {
      const files = await readdir(tempDir);
      expect(files).toContain('types.ts');

      const stats = await stat(resolvedOutput);
      expect(stats.isFile()).toBe(true);

      const content = await readFile(resolvedOutput, 'utf-8');
      expect(content).toContain('ArticlePage');
    });
  });

  it('should create file with .tsx extension', async () => {
    await createTestFile('./cms-types.tsx', async (tempDir, resolvedOutput) => {
      const files = await readdir(tempDir);
      expect(files).toContain('cms-types.tsx');

      const stats = await stat(resolvedOutput);
      expect(stats.isFile()).toBe(true);
    });
  });

  it('should create manifest.ts in directory when path has no .ts extension', async () => {
    await createTestFile('./types', async (tempDir, resolvedOutput) => {
      const files = await readdir(resolve(tempDir, 'types'));
      expect(files).toContain('manifest.ts');

      const stats = await stat(resolvedOutput);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  it('should create parent directories when using nested path with .ts', async () => {
    await createTestFile('./src/cms/types.ts', async (tempDir, resolvedOutput) => {
      const srcStats = await stat(resolve(tempDir, 'src'));
      expect(srcStats.isDirectory()).toBe(true);

      const cmsStats = await stat(resolve(tempDir, 'src', 'cms'));
      expect(cmsStats.isDirectory()).toBe(true);

      const fileStats = await stat(resolvedOutput);
      expect(fileStats.isFile()).toBe(true);
    });
  });

  it('should handle filename with multiple dots correctly', async () => {
    await createTestFile('./my.content.types.ts', async (tempDir, resolvedOutput) => {
      const fileName = basename(resolvedOutput);
      expect(fileName).toBe('my.content.types.ts');

      const files = await readdir(tempDir);
      expect(files).toContain('my.content.types.ts');
    });
  });
});
