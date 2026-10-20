import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getRelevantPath, makeDirs, makeFiles } from '../utils/make.js';

describe('make utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cli-make-'));
  });

  afterEach(() => rm(tempDir, { recursive: true, force: true }));

  test('getRelevantPath strips the output directory and the separator after it', () => {
    expect(getRelevantPath(join(tempDir, 'page', 'HomeCT.ts'), tempDir)).toBe(
      join('page', 'HomeCT.ts'),
    );
  });

  test('makeDirs creates nested directories under the given path', async () => {
    await makeDirs(['page', join('component', 'nested')], tempDir);

    expect((await stat(join(tempDir, 'page'))).isDirectory()).toBe(true);
    expect((await stat(join(tempDir, 'component', 'nested'))).isDirectory()).toBe(true);
  });

  test('makeDirs accepts directories that already exist', async () => {
    await makeDirs(['page'], tempDir);

    await expect(makeDirs(['page'], tempDir)).resolves.toBeDefined();
  });

  test('makeFiles writes every file with its content', async () => {
    await makeFiles([
      { path: join(tempDir, 'a.ts'), content: 'export const a = 1;' },
      { path: join(tempDir, 'b.ts'), content: 'export const b = 2;' },
    ]);

    expect(await readFile(join(tempDir, 'a.ts'), 'utf-8')).toBe('export const a = 1;');
    expect(await readFile(join(tempDir, 'b.ts'), 'utf-8')).toBe('export const b = 2;');
  });
});
