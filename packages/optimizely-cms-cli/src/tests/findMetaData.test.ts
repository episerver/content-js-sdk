import {
  describe,
  it,
  test,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { findMetaData } from '../service/utils.js';
import { componentSource, printed } from './helpers.js';

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

  describe('with a component folder', () => {
    let tempDir: string;
    let cwd: string;
    let consoleLog: MockInstance;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'cli-metadata-'));
      cwd = pathToFileURL(tempDir).href;
      await mkdir(join(tempDir, 'comp'));
      await writeFile(join(tempDir, 'comp', 'Hero.ts'), contentTypeSource('Hero'));
      consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(async () => {
      vi.restoreAllMocks();
      await rm(tempDir, { recursive: true, force: true });
    });

    test('rejects a list made only of exclusion patterns', async () => {
      await expect(findMetaData(['!comp'], cwd)).rejects.toThrow(
        'cannot have only exclusion patterns',
      );
    });

    test('ignores surrounding whitespace and blank entries', async () => {
      const { contentTypes } = await findMetaData(['', ' comp/*.ts ', '   '], cwd);

      expect(contentTypes.map(it => it.key)).toEqual(['Hero']);
    });

    test('returns empty lists when no file matches', async () => {
      await expect(findMetaData(['missing/**/*.ts'], cwd)).resolves.toEqual({
        contentTypes: [],
        displayTemplates: [],
        contracts: [],
      });
    });

    test('loads a file matched by several patterns only once', async () => {
      const { contentTypes } = await findMetaData(['comp/*.ts', 'comp/Hero.ts'], cwd);

      expect(contentTypes.map(it => it.key)).toEqual(['Hero']);
    });

    test('logs each definition found by default', async () => {
      await findMetaData(['comp/*.ts'], cwd);

      expect(printed(consoleLog)).toContain('Content Type Hero found in ./comp/Hero.ts');
    });

    test('stays silent with log: false', async () => {
      await findMetaData(['comp/*.ts'], cwd, { log: false });

      expect(consoleLog).not.toHaveBeenCalled();
    });

    test('extracts display templates and contracts without SDK markers', async () => {
      await writeFile(
        join(tempDir, 'comp', 'Extras.ts'),
        componentSource([
          { __type: 'displayTemplate', key: 'HeroWide', contentType: 'Hero', tag: 'x' },
          { __type: 'contract', key: 'SeoContract', displayName: 'SEO' },
          { key: 'NotADefinition' },
        ]),
      );

      const result = await findMetaData(['comp/Extras.ts'], cwd, { log: false });

      expect(result).toEqual({
        contentTypes: [],
        displayTemplates: [{ key: 'HeroWide', contentType: 'Hero' }],
        contracts: [{ key: 'SeoContract', displayName: 'SEO' }],
      });
    });
  });
});
