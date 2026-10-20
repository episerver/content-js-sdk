import { describe, it, expect } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { findMetaData } from '../service/utils.js';

const contentTypeSource = (key: string, displayName = key) =>
  `export const ${key} = { __type: 'contentType', key: '${key}', displayName: '${displayName}', baseType: 'component', properties: {} };\n`;

describe('findMetaData', () => {
  it('excludes files nested under a bare directory pattern (e.g. "!src/legacy")', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'cli-filter-test-'));

    try {
      await mkdir(join(tempDir, 'comp', 'legacy'), { recursive: true });
      await writeFile(join(tempDir, 'comp', 'Hero.ts'), contentTypeSource('Hero'));
      // invalid syntax: if this file is not excluded, esbuild throws and the test fails
      await writeFile(join(tempDir, 'comp', 'legacy', 'Old.ts'), 'not valid ts !!! (((');

      const cwd = pathToFileURL(`${tempDir}/`).href;
      const { contentTypes } = await findMetaData(
        ['comp/**/*.ts', '!comp/legacy'],
        cwd,
      );

      expect(contentTypes.map(c => c.key)).toEqual(['Hero']);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('preserves `components` pattern order so earlier entries take precedence on key conflicts', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'cli-order-test-'));

    try {
      await mkdir(join(tempDir, 'src', 'app', 'components'), { recursive: true });
      await mkdir(join(tempDir, 'node_modules', 'my-package'), { recursive: true });
      await writeFile(
        join(tempDir, 'src', 'app', 'components', 'Hero.ts'),
        contentTypeSource('Hero', 'Custom Hero'),
      );
      await writeFile(
        join(tempDir, 'node_modules', 'my-package', 'Hero.ts'),
        contentTypeSource('Hero', 'Package Hero'),
      );

      const cwd = pathToFileURL(`${tempDir}/`).href;
      // custom implementation listed first, package default listed second
      const { contentTypes } = await findMetaData(
        ['src/app/**/components/**/*.ts', 'node_modules/my-package/**/*.ts'],
        cwd,
      );

      // first match in `components` order must come first in the result
      expect(contentTypes.map(c => c.displayName)).toEqual(['Custom Hero', 'Package Hero']);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
