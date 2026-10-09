import { describe, it, expect } from 'vitest';
import { contentType } from '@optimizely/cms-sdk';
import { validateContentAreaConstraints } from '../utils/mapping.js';
import { mapContentToManifest } from '../mapper/contentToPackage.js';
import { generateContentCode } from '../utils/generate.js';
import { Manifest, ManifestContentType } from '../utils/manifest.js';
import { HeroComponentType, BannerComponentType } from './fixtures.js';

/**
 * `composition` configures the built-in canvas an `_experience` or `_section`
 * already has. It is not a property — the CMS reserves that key — so it sits
 * beside `properties` and is mapped by the content type transform, not by
 * `transformProperties`.
 */

const CanvasPageType = contentType({
  key: 'CanvasPageType',
  displayName: 'Canvas Page Type',
  baseType: '_experience',
  composition: {
    format: 'grid',
    allowedTypes: [HeroComponentType, '_component'],
    restrictedTypes: [BannerComponentType],
  },
  properties: {},
});

describe('the built-in composition configuration', () => {
  it('flattens the type lists to keys', () => {
    const [mapped] = mapContentToManifest([CanvasPageType]);

    expect(mapped.composition).toEqual({
      format: 'grid',
      allowedTypes: ['HeroComponent', '_component'],
      restrictedTypes: ['BannerComponent'],
    });
  });

  it('carries a format on its own', () => {
    const outline = contentType({
      key: 'OutlineSection',
      displayName: 'Outline Section',
      baseType: '_section',
      composition: { format: 'outline' },
      properties: {},
    });

    expect(mapContentToManifest([outline])[0].composition).toEqual({
      format: 'outline',
    });
  });

  it('is left off entirely when not declared', () => {
    const plain = contentType({
      key: 'PlainExperience',
      displayName: 'Plain Experience',
      baseType: '_experience',
      properties: {},
    });

    expect(mapContentToManifest([plain])[0]).not.toHaveProperty('composition');
  });

  it('drops a wildcard, which the API expresses as no list at all', () => {
    const wildcard = contentType({
      key: 'WildcardExperience',
      displayName: 'Wildcard Experience',
      baseType: '_experience',
      composition: { allowedTypes: ['*'] },
      properties: {},
    });

    expect(mapContentToManifest([wildcard])[0].composition).toEqual({});
  });

  it('resolves `_self` to the owning content type', () => {
    const self = contentType({
      key: 'SelfExperience',
      displayName: 'Self Experience',
      baseType: '_experience',
      composition: { allowedTypes: ['_self'] },
      properties: {},
    });

    expect(mapContentToManifest([self])[0].composition).toEqual({
      allowedTypes: ['SelfExperience'],
    });
  });

  it('accepts every known format', () => {
    for (const format of ['grid', 'outline'] as const) {
      const ct = contentType({
        key: 'FormatExperience',
        displayName: 'Format Experience',
        baseType: '_experience',
        composition: { format },
        properties: {},
      });

      expect(validateContentAreaConstraints([ct]).errors).toEqual([]);
    }
  });

  it('reports an unknown format', () => {
    // Only reachable from a plain JS config or a cast; `push` has to survive it.
    const broken = {
      key: 'BrokenExperience',
      displayName: 'Broken Experience',
      baseType: '_experience',
      composition: { format: 'stack' },
      properties: {},
    } as any;

    expect(validateContentAreaConstraints([broken]).errors).toEqual([
      'Content type "BrokenExperience", built-in composition: invalid "format" "stack". Must be "grid" or "outline".',
    ]);
  });
});

describe('pulling the built-in composition configuration back into a model', () => {
  const pulledPage: ManifestContentType = {
    key: 'PulledCanvas',
    displayName: 'Pulled Canvas',
    baseType: '_experience',
    isContract: false,
    composition: {
      format: 'grid',
      allowedTypes: ['HeroComponent', '_component'],
      restrictedTypes: [],
    },
    properties: {},
  };

  const manifest: Manifest = {
    contentTypes: [
      pulledPage,
      {
        key: 'HeroComponent',
        displayName: 'Hero Component',
        baseType: '_component',
        isContract: false,
        properties: {},
      },
    ],
    displayTemplates: [],
  };

  it('emits the configuration, imports the allowed type and drops the empty list', () => {
    const result = generateContentCode(pulledPage, manifest, false, new Map());

    expect(result).toMatchInlineSnapshot(`
      "import { contentType } from '@optimizely/cms-sdk';
      import { HeroComponentCT } from './HeroComponentCT';

      /**
       * Pulled Canvas
       */
      export const PulledCanvasCT = contentType({
        key: 'PulledCanvas',
        displayName: 'Pulled Canvas',
        baseType: '_experience',
        composition: {
          format: 'grid',
          allowedTypes: [
            HeroComponentCT,
            '_component'
          ]
        }
      });
      "
    `);
  });
});
