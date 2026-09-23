import { describe, it, expect } from 'vitest';
import { generateRegistryCode } from '../utils/generate.js';
import { Manifest } from '../utils/manifest.js';

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
});
