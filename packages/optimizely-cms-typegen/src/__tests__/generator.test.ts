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

      const registry = await fs.readFile(path.join(testRoot, '.optimizely', 'registry.ts'), 'utf-8');
      expect(registry).toMatch(/^\/\/ @generated/);
      expect(registry).toContain('/// <reference path="./global.d.ts" />');
      expect(registry).toContain("from '../src/components/a'");
      expect(registry).toContain('ArticleContentType,');
      expect(registry).toContain('NewsContentType,');
      expect(registry).toContain('SeoContract,');

      const types = await fs.readFile(path.join(testRoot, '.optimizely', 'global.d.ts'), 'utf-8');
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

      const registry = await fs.readFile(path.join(testRoot, '.optimizely', 'registry.ts'), 'utf-8');
      expect(registry).toContain("import CardComponent, { tags as CardComponentTags } from '../src/components/Card';");
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

      const registry = await fs.readFile(path.join(testRoot, '.optimizely', 'registry.ts'), 'utf-8');
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

      const registry = await fs.readFile(path.join(testRoot, '.optimizely', 'registry.ts'), 'utf-8');
      expect(registry).toContain("'Nested': NestedComponent,");
      const types = await fs.readFile(path.join(testRoot, '.optimizely', 'global.d.ts'), 'utf-8');
      expect(types).not.toContain('wrong');
    });
  });

  describe('platform', () => {
    it('emits OptimizelyCmsRegister from config({ platform })', async () => {
      await fs.mkdir(path.join(testRoot, 'src', 'app'), { recursive: true });
      await fs.writeFile(
        path.join(testRoot, 'optimizely.config.mjs'),
        `export default { components: 'src/components/**/*.tsx' };`
      );
      await fs.writeFile(
        path.join(testRoot, 'src', 'app', 'layout.tsx'),
        `import { config } from '@optimizely/cms-sdk';
config({ apiKey: 'k', query: { cache: true }, platform: 'paas' });`
      );
      await generate(testRoot);
      const types = await fs.readFile(path.join(testRoot, '.optimizely', 'global.d.ts'), 'utf-8');
      expect(types).toContain("platform: 'paas';");
      expect(types).toContain('interface OptimizelyCmsRegister');
    });

    it('emits nothing when no platform is set', async () => {
      await fs.mkdir(path.join(testRoot, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(testRoot, 'src', 'layout.tsx'),
        `import { config } from '@optimizely/cms-sdk';\nconfig({ apiKey: 'k' });`
      );
      await generate(testRoot);
      const types = await fs.readFile(path.join(testRoot, '.optimizely', 'global.d.ts'), 'utf-8');
      expect(types).not.toContain('OptimizelyCmsRegister');
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
      const registryPath = path.join(testRoot, '.optimizely', 'registry.ts');
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
      const typesPath = path.join(testRoot, '.optimizely', 'global.d.ts');
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
        path.join(testRoot, '.optimizely', 'registry.ts'),
        'utf-8'
      );
      expect(registryContent).toContain('HeroDisplayTemplate');
      expect(registryContent).toContain('export const displayTemplates');
      expect(registryContent).toContain('initDisplayTemplateRegistry');
    });
  });
});
