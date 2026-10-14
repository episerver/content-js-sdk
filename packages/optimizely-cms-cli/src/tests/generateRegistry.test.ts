import { describe, it, test, expect } from 'vitest';
import { posix } from 'node:path';
import { generateRegistryCode } from '../utils/generate.js';
import { Manifest } from '../utils/manifest.js';
import { manifestContentType } from './helpers.js';

const manifest: Manifest = {
  contentTypes: [
    {
      key: 'ArticlePage',
      displayName: 'Article Page',
      baseType: '_page',
      isContract: false,
      properties: { heading: { type: 'string' } },
    },
    {
      key: 'SEOContract',
      displayName: 'SEO Contract',
      isContract: true,
      properties: { metaTitle: { type: 'string' } },
    },
  ],
  displayTemplates: [
    {
      key: 'HeroDisplay',
      displayName: 'Hero Display',
      isDefault: false,
      contentType: 'HeroComponent',
      settings: {},
    },
  ],
};

describe('generateRegistryCode', () => {
  it('registers content types, contracts and display templates', () => {
    const code = generateRegistryCode(manifest, { useGrouping: true });

    expect(code).toContain(`import { ArticlePageCT } from './page/ArticlePageCT';`);
    expect(code).toContain(`import { SEOContract } from './contract/SEOContract';`);
    expect(code).toContain(
      `import { HeroDisplayDT } from './displayTemplates/HeroDisplayDT';`,
    );
    expect(code).toContain(
      'initContentTypeRegistry([\n    ArticlePageCT,\n    SEOContract,\n  ]);',
    );
    expect(code).toContain('initDisplayTemplateRegistry([\n    HeroDisplayDT,\n  ]);');
    expect(code).not.toContain('config(');
  });

  it('uses a content type, never a contract, in the example comment', () => {
    const code = generateRegistryCode({
      contentTypes: [manifest.contentTypes[1], manifest.contentTypes[0]],
    });

    expect(code).toContain('{ ArticlePage: ArticlePageComponent }');
  });

  it('adds config() and flat imports when requested', () => {
    const code = generateRegistryCode(manifest, { includeConfig: true });

    expect(code).toContain(`import { ArticlePageCT } from './ArticlePageCT';`);
    expect(code).toContain('apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!');
    expect(code).toContain(
      `import { config, initContentTypeRegistry, initDisplayTemplateRegistry } from '@optimizely/cms-sdk';`,
    );
  });

  it('imports everything from one module in single-file mode', () => {
    const code = generateRegistryCode(manifest, { singleFileModule: './manifest' });

    expect(code).toContain(
      `import { ArticlePageCT, SEOContract, HeroDisplayDT } from './manifest';`,
    );
  });

  test('produces an empty initialize() without imports for an empty manifest', () => {
    const code = generateRegistryCode({ contentTypes: [] });

    expect(code).not.toMatch(/^import /m);
    expect(code).toContain('{ ArticlePage: ArticlePageComponent }');
    expect(code).toContain('export function initialize() {\n\n}');
  });

  test('registers only display templates when there are no content types', () => {
    const code = generateRegistryCode({
      contentTypes: [],
      displayTemplates: manifest.displayTemplates,
    });

    expect(code).toContain(`import { initDisplayTemplateRegistry } from '@optimizely/cms-sdk';`);
    expect(code).not.toContain('initContentTypeRegistry');
  });

  test('registers only content types when there are no display templates', () => {
    const code = generateRegistryCode({ contentTypes: manifest.contentTypes });

    expect(code).toContain(`import { initContentTypeRegistry } from '@optimizely/cms-sdk';`);
    expect(code).not.toContain('initDisplayTemplateRegistry');
  });

  test('imports a grouped content type without baseType from the output root', () => {
    const code = generateRegistryCode(
      { contentTypes: [manifestContentType('Generic', { baseType: undefined })] },
      { useGrouping: true },
    );
    const importPath = code.match(/import \{ GenericCT \} from '(.+)';/)?.[1];

    expect(importPath && posix.normalize(importPath)).toBe('GenericCT');
  });
});
