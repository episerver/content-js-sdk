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
  it('registers content types and display templates, skipping contracts', () => {
    const code = generateRegistryCode(manifest, { useGrouping: true });

    expect(code).toContain(`import { ArticlePageCT } from './page/ArticlePageCT';`);
    expect(code).toContain(
      `import { HeroDisplayDT } from './displayTemplates/HeroDisplayDT';`,
    );
    expect(code).not.toContain('SEOContract');
    expect(code).toContain('initContentTypeRegistry([\n    ArticlePageCT,\n  ]);');
    expect(code).toContain('initDisplayTemplateRegistry([\n    HeroDisplayDT,\n  ]);');
    expect(code).not.toContain('config(');
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
      `import { ArticlePageCT, HeroDisplayDT } from './manifest';`,
    );
  });
});
