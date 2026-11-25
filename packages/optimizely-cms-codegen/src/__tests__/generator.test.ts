import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, loadConfig, scanComponents } from '../generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');
const testRoot = path.join(fixturesDir, 'test-project');

describe('generator', () => {
  beforeEach(async () => {
    // Clean up test directory
    await fs.rm(testRoot, { recursive: true, force: true });
    await fs.mkdir(testRoot, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after tests
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('returns null when config does not exist', async () => {
      const config = await loadConfig(testRoot);
      expect(config).toBeNull();
    });

    it('loads config when optimizely.config.mjs exists', async () => {
      const configPath = path.join(testRoot, 'optimizely.config.mjs');
      await fs.writeFile(
        configPath,
        `export default { components: 'src/**/*.tsx' };`
      );

      const config = await loadConfig(testRoot);
      expect(config).toEqual({ components: 'src/**/*.tsx' });
    });
  });

  describe('loadConfig errors', () => {
    it('throws on a broken config instead of returning null', async () => {
      await fs.writeFile(path.join(testRoot, 'optimizely.config.mjs'), 'export default {');
      await expect(loadConfig(testRoot)).rejects.toThrow();
    });

    it('sees config edits after the first load', async () => {
      const configPath = path.join(testRoot, 'optimizely.config.mjs');
      await fs.writeFile(configPath, `export default { a: 1 };`);
      await loadConfig(testRoot);
      await fs.writeFile(configPath, `export default { a: 2 };`);
      expect(await loadConfig(testRoot)).toEqual({ a: 2 });
    });
  });

  describe('detection by call', () => {
    it('finds content types whatever the variable is named', async () => {
      await fs.mkdir(path.join(testRoot, 'src', 'components'), { recursive: true });
      await fs.writeFile(path.join(testRoot, 'optimizely.config.mjs'), `export default { components: 'src/components/**/*.tsx' };`);
      await fs.writeFile(
        path.join(testRoot, 'src', 'components', 'Start.tsx'),
        `export const StartPage = contentType({ key: 'Start', baseType: '_page' });\nexport default function Start() {}`
      );
      await fs.writeFile(
        path.join(testRoot, 'src', 'components', 'Button.tsx'),
        `export const ButtonComponent = contentType({ key: 'Button', baseType: '_component' });
export const ButtonLook = displayTemplate({ key: 'ButtonLook', baseType: '_component' });
export default function Button() {}`
      );

      await generate(testRoot);

      const registry = await fs.readFile(path.join(testRoot, 'src', 'registry.ts'), 'utf-8');
      expect(registry).toContain('StartPage,');
      expect(registry).toContain('ButtonComponent,');
      expect(registry).toContain('ButtonLook,');
      expect(registry).toContain("'Start': StartPageComponent,");
      expect(registry).toContain("'Button': ButtonComponentComponent,");
      const types = await fs.readFile(path.join(testRoot, 'global.d.ts'), 'utf-8');
      expect(types).toMatch(/'Start': string;/);
      expect(types).toMatch(/'Button': string;/);
    });
  });

  describe('safety', () => {
    it('writes nothing without optimizely.config.mjs', async () => {
      await fs.mkdir(path.join(testRoot, 'src'), { recursive: true });
      await expect(generate(testRoot)).rejects.toThrow('optimizely.config.mjs not found');
      await expect(fs.access(path.join(testRoot, 'src', 'registry.ts'))).rejects.toThrow();
    });

    it('check reports stale files without writing, then passes after generate', async () => {
      await fs.mkdir(path.join(testRoot, 'src', 'components'), { recursive: true });
      await fs.writeFile(path.join(testRoot, 'optimizely.config.mjs'), `export default { components: 'src/components/**/*.tsx' };`);

      expect((await generate(testRoot, { check: true })).stale).toHaveLength(2);
      await expect(fs.access(path.join(testRoot, 'global.d.ts'))).rejects.toThrow();

      await generate(testRoot);
      expect((await generate(testRoot, { check: true })).stale).toEqual([]);
    });
  });

  describe('registry location', () => {
    it('uses app/ when there is no src/', async () => {
      await fs.mkdir(path.join(testRoot, 'app'), { recursive: true });
      await fs.mkdir(path.join(testRoot, 'components'), { recursive: true });
      await fs.writeFile(path.join(testRoot, 'optimizely.config.mjs'), `export default { components: 'components/**/*.tsx' };`);
      await fs.writeFile(
        path.join(testRoot, 'components', 'Hero.tsx'),
        `export const HeroContentType = contentType({ key: 'Hero', baseType: '_component' });\nexport default function Hero() {}`
      );

      await generate(testRoot);

      const registry = await fs.readFile(path.join(testRoot, 'app', 'registry.ts'), 'utf-8');
      expect(registry).toContain("from '../components/Hero'");
      await fs.access(path.join(testRoot, 'global.d.ts'));
    });
  });

  describe('multiple exports per file', () => {
    it('registers every content type and keeps keys tied to their export', async () => {
      const srcDir = path.join(testRoot, 'src', 'components');
      await fs.mkdir(srcDir, { recursive: true });
      await fs.writeFile(
        path.join(testRoot, 'optimizely.config.mjs'),
        `export default { components: 'src/components/**/*.ts', propertyGroups: [{ key: "it's" }] };`
      );
      await fs.writeFile(
        path.join(srcDir, 'a.ts'),
        `export const ArticleContentType = contentType({ baseType: '_page', properties: { x: { type: 'string' } }, key: 'Article' });
export const NewsContentType = contentType({ baseType: '_component', key: 'News' });
export const SeoContract = contract({ key: 'Seo' });`
      );

      await generate(testRoot);

      const registry = await fs.readFile(path.join(testRoot, 'src', 'registry.ts'), 'utf-8');
      expect(registry).toMatch(/^\/\/ @generated/);
      expect(registry).toContain("from './components/a'");
      expect(registry).toContain('ArticleContentType,');
      expect(registry).toContain('NewsContentType,');
      expect(registry).toContain('SeoContract,');

      const types = await fs.readFile(path.join(testRoot, 'global.d.ts'), 'utf-8');
      expect(types).toContain("'Article': string;");
      expect(types).toContain("'News': string;");
      expect(types).toContain("'Seo': string;");
      expect(types).toContain("'it\\'s': string;");
      // only the _page type may contain children
      expect(types.split('MayContainRegistry')[1]).toContain("'Article'");
      expect(types.split('MayContainRegistry')[1]).not.toContain("'News'");
    });
  });

  describe('components', () => {
    it('registers the default export of a content type file, with tags and a missing-type warning', async () => {
      const dir = path.join(testRoot, 'src', 'components');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(testRoot, 'optimizely.config.mjs'),
        `export default { components: 'src/components/*.tsx' };`
      );
      await fs.writeFile(
        path.join(dir, 'Card.tsx'),
        `export const CardContentType = contentType({ key: 'Card' });
export const tags = { small: 1 };
export default function Card() {}`
      );
      await fs.writeFile(path.join(dir, 'Plain.tsx'), `export const PlainContentType = contentType({ key: 'Plain' });`);

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await generate(testRoot);

      const registry = await fs.readFile(path.join(testRoot, 'src', 'registry.ts'), 'utf-8');
      expect(registry).toContain("import CardComponent, { tags as CardComponentTags } from './components/Card';");
      expect(registry).toContain("'Card': { default: CardComponent, tags: CardComponentTags },");
      expect(registry).not.toContain("'Plain'");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Plain'));
      warn.mockRestore();
    });
  });

  describe('components in separate files', () => {
    it('matches by content type use, display template tag and file name; first duplicate wins', async () => {
      const dir = path.join(testRoot, 'src');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(testRoot, 'optimizely.config.mjs'),
        `export default { components: 'src/*.tsx' };`
      );
      await fs.writeFile(
        path.join(dir, 'types.tsx'),
        `export const TeaserContentType = contentType({ key: 'Teaser' });
export const HeroContentType = contentType({ key: 'Hero' });
export const TeaserBigDisplayTemplate = displayTemplate({ key: 'Big', contentType: 'Teaser', tag: 'big' });`
      );
      await fs.writeFile(path.join(dir, 'A.tsx'), `import { TeaserContentType } from './types';\nexport default function A() {}`);
      await fs.writeFile(path.join(dir, 'B.tsx'), `import { TeaserContentType } from './types';\nexport default function B() {}`);
      await fs.writeFile(path.join(dir, 'Big.tsx'), `import { TeaserBigDisplayTemplate } from './types';\nexport default function Big() {}`);
      await fs.writeFile(path.join(dir, 'C.tsx'), `// uses TeaserContentType\nexport default function C() {}`);
      await fs.writeFile(path.join(dir, 'Hero.tsx'), `export default function Hero() {}`);

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await generate(testRoot);

      const registry = await fs.readFile(path.join(testRoot, 'src', 'registry.ts'), 'utf-8');
      expect(registry).toContain("'Teaser': TeaserComponent,");
      expect(registry).toContain("'Teaser:big': Teaser_bigComponent,");
      expect(registry).toContain("'Hero': HeroComponent,");
      expect(registry).not.toContain('/src/C');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("'Teaser' already has a component"));
      warn.mockRestore();
    });
  });

  describe('parsing', () => {
    it('reads the top-level key, and a default export written as `export { X as default }`', async () => {
      const dir = path.join(testRoot, 'src');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(testRoot, 'optimizely.config.mjs'),
        `export default { components: 'src/*.tsx' };`
      );
      await fs.writeFile(
        path.join(dir, 'Nested.tsx'),
        `export const NestedContentType = contentType({ properties: { a: { key: 'wrong' } }, key: 'Nested' });
const Nested = () => null;
export { Nested as default };`
      );
      await generate(testRoot);

      const registry = await fs.readFile(path.join(testRoot, 'src', 'registry.ts'), 'utf-8');
      expect(registry).toContain("'Nested': NestedComponent,");
      const types = await fs.readFile(path.join(testRoot, 'global.d.ts'), 'utf-8');
      expect(types).not.toContain('wrong');
    });
  });

  describe('scanComponents', () => {
    it('scans component files based on config pattern', async () => {
      // Create config
      await fs.writeFile(
        path.join(testRoot, 'optimizely.config.mjs'),
        `export default { components: 'src/components/**/*.tsx' };`
      );

      // Create component files
      const componentsDir = path.join(testRoot, 'src/components');
      await fs.mkdir(componentsDir, { recursive: true });
      await fs.writeFile(path.join(componentsDir, 'Hero.tsx'), '');
      await fs.writeFile(path.join(componentsDir, 'Button.tsx'), '');

      const files = await scanComponents(testRoot);
      expect(files).toHaveLength(2);
      expect(files.some(f => f.endsWith('Hero.tsx'))).toBe(true);
      expect(files.some(f => f.endsWith('Button.tsx'))).toBe(true);
    });
  });

  describe('generate', () => {
    it('generates registry.ts and global.d.ts files', async () => {
      // Setup test project structure
      const srcDir = path.join(testRoot, 'src');
      const componentsDir = path.join(srcDir, 'components');
      await fs.mkdir(componentsDir, { recursive: true });

      // Create config
      await fs.writeFile(
        path.join(testRoot, 'optimizely.config.mjs'),
        `export default { components: 'src/components/**/*.tsx' };`
      );

      // Create component with contentType
      await fs.writeFile(
        path.join(componentsDir, 'Hero.tsx'),
        `import { contentType } from '@optimizely/cms-sdk';

export const HeroContentType = contentType({
  key: 'Hero',
  displayName: 'Hero Block',
});

export default function Hero() {
  return <div>Hero</div>;
}
`
      );

      // Create component with contract
      await fs.writeFile(
        path.join(componentsDir, 'Button.tsx'),
        `import { contract } from '@optimizely/cms-sdk';

export const ButtonContract = contract({
  key: 'Button',
  displayName: 'Button Component',
});

export default function Button() {
  return <button>Click</button>;
}
`
      );

      // Generate files
      const result = await generate(testRoot);

      expect(result.files).toHaveLength(2);

      // Check registry.ts was created
      const registryPath = path.join(testRoot, 'src', 'registry.ts');
      const registryExists = await fs
        .access(registryPath)
        .then(() => true)
        .catch(() => false);
      expect(registryExists).toBe(true);

      // Check registry content
      const registryContent = await fs.readFile(registryPath, 'utf-8');
      expect(registryContent).toContain('HeroContentType');
      expect(registryContent).toContain('ButtonContract');
      expect(registryContent).toContain('BlankExperienceContentType');
      expect(registryContent).toContain('export const contentTypes');
      expect(registryContent).toContain('export function initRegistry(');

      // Check global.d.ts was created
      const typesPath = path.join(testRoot, 'global.d.ts');
      const typesExists = await fs
        .access(typesPath)
        .then(() => true)
        .catch(() => false);
      expect(typesExists).toBe(true);

      // Check types content
      const typesContent = await fs.readFile(typesPath, 'utf-8');
      expect(typesContent).toContain("'Hero': string");
      expect(typesContent).toContain("'Button': string");
      expect(typesContent).toContain('ContentTypeRegistry');
    });

    it('generates registry with display templates', async () => {
      const srcDir = path.join(testRoot, 'src');
      const componentsDir = path.join(srcDir, 'components');
      await fs.mkdir(componentsDir, { recursive: true });

      await fs.writeFile(
        path.join(testRoot, 'optimizely.config.mjs'),
        `export default { components: 'src/components/**/*.tsx' };`
      );

      await fs.writeFile(
        path.join(componentsDir, 'HeroTemplate.tsx'),
        `import { displayTemplate, contentType } from '@optimizely/cms-sdk';

export const HeroContentType = contentType({
  key: 'Hero',
  displayName: 'Hero',
});

export const HeroDisplayTemplate = displayTemplate({
  key: 'HeroWide',
  displayName: 'Hero Wide',
});
`
      );

      await generate(testRoot);

      const registryContent = await fs.readFile(
        path.join(testRoot, 'src', 'registry.ts'),
        'utf-8'
      );
      expect(registryContent).toContain('HeroDisplayTemplate');
      expect(registryContent).toContain('export const displayTemplates');
      expect(registryContent).toContain('initDisplayTemplateRegistry');
    });
  });
  describe('matching edge cases', () => {
    const setup = async (files: Record<string, string>) => {
      await fs.mkdir(path.join(testRoot, 'src', 'components'), { recursive: true });
      await fs.writeFile(path.join(testRoot, 'optimizely.config.mjs'), `export default { components: 'src/components/**/*.tsx' };`);
      for (const [name, body] of Object.entries(files)) {
        await fs.writeFile(path.join(testRoot, 'src', 'components', name), body);
      }
    };
    const registry = () => fs.readFile(path.join(testRoot, 'src', 'registry.ts'), 'utf-8');

    it('an import-only file never beats the file named after the type', async () => {
      // Article.tsx matches by file name; AAA.tsx (sorts first) only by import
      await setup({
        'Types.tsx': `export const ArticleContentType = contentType({ key: 'Article', baseType: '_component' });`,
        'Article.tsx': `export default function A() {}`,
        'AAA.tsx': `import { ArticleContentType } from './Types';\nexport default function Helper() {}`,
      });
      await generate(testRoot);
      expect(await registry()).toContain("from './components/Article';");
      expect(await registry()).not.toContain("from './components/AAA';");
    });

    it('fails when two files export the same name', async () => {
      await setup({
        'a.tsx': `export const HeroContentType = contentType({ key: 'HeroA', baseType: '_component' });`,
        'b.tsx': `export const HeroContentType = contentType({ key: 'HeroB', baseType: '_component' });`,
      });
      await expect(generate(testRoot)).rejects.toThrow("'HeroContentType' is exported by both");
    });

    it('skips a component whose tag is not a string literal', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await setup({
        'Hero.tsx': `export const HeroContentType = contentType({ key: 'Hero', baseType: '_component' });\nexport const tag = TAG;\nexport default function H() {}`,
      });
      await generate(testRoot);
      expect(await registry()).not.toContain("'Hero'");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('tag must be a string literal'));
      warn.mockRestore();
    });
  });
});
