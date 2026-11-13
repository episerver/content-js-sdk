import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, loadConfig, scanComponents, detectBaseDir } from '../generator.js';

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

  describe('detectBaseDir', () => {
    it('detects src directory', async () => {
      await fs.mkdir(path.join(testRoot, 'src'));
      const baseDir = await detectBaseDir(testRoot);
      expect(baseDir).toBe('src');
    });

    it('detects app directory when src does not exist', async () => {
      await fs.mkdir(path.join(testRoot, 'app'));
      const baseDir = await detectBaseDir(testRoot);
      expect(baseDir).toBe('app');
    });

    it('returns . when neither src nor app exist', async () => {
      const baseDir = await detectBaseDir(testRoot);
      expect(baseDir).toBe('.');
    });

    it('prefers src over app when both exist', async () => {
      await fs.mkdir(path.join(testRoot, 'src'));
      await fs.mkdir(path.join(testRoot, 'app'));
      const baseDir = await detectBaseDir(testRoot);
      expect(baseDir).toBe('src');
    });
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

      const registry = await fs.readFile(path.join(testRoot, 'src', 'registry.ts'), 'utf-8');
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
      const types = await fs.readFile(path.join(testRoot, 'global.d.ts'), 'utf-8');
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
      const types = await fs.readFile(path.join(testRoot, 'global.d.ts'), 'utf-8');
      expect(types).not.toContain('OptimizelyCmsRegister');
    });
  });

  describe('scanComponents', () => {
    it('returns empty array when no config', async () => {
      const files = await scanComponents(testRoot);
      expect(files).toEqual([]);
    });

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
      expect(result.baseDir).toBe('src');

      // Check registry.ts was created
      const registryPath = path.join(srcDir, 'registry.ts');
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
      expect(registryContent).toContain('export function initRegistry()');

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
        path.join(srcDir, 'registry.ts'),
        'utf-8'
      );
      expect(registryContent).toContain('HeroDisplayTemplate');
      expect(registryContent).toContain('export const displayTemplates');
      expect(registryContent).toContain('initDisplayTemplateRegistry');
    });

    it('handles empty component directory', async () => {
      const srcDir = path.join(testRoot, 'src');
      await fs.mkdir(srcDir, { recursive: true });

      await fs.writeFile(
        path.join(testRoot, 'optimizely.config.mjs'),
        `export default { components: 'src/components/**/*.tsx' };`
      );

      const result = await generate(testRoot);

      expect(result.files).toHaveLength(0);

      const registryContent = await fs.readFile(
        path.join(srcDir, 'registry.ts'),
        'utf-8'
      );
      expect(registryContent).toContain('BlankExperienceContentType');
      expect(registryContent).toContain('export const contentTypes = [');
    });
  });
});
