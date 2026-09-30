import { describe, it, expect } from 'vitest';
import { contentType } from '@optimizely/cms-sdk';
import { transformProperties, validateContentAreaConstraints } from '../utils/mapping.js';
import { generateContentCode } from '../utils/generate.js';
import { Manifest, ManifestContentType } from '../utils/manifest.js';
import { HeroComponentType, BannerComponentType } from './fixtures.js';

/**
 * A composition property is pushed like any other: its `allowedTypes` and
 * `restrictedTypes` are flattened to content type keys, and `*` is dropped
 * because the API expresses "anything" as an absent list.
 */

const SidebarPageType = contentType({
  key: 'SidebarPageType',
  displayName: 'Sidebar Page Type',
  baseType: '_page',
  properties: {
    sidebar: {
      type: 'composition',
      displayName: 'Sidebar',
      allowedTypes: [HeroComponentType, '_component'],
      restrictedTypes: [BannerComponentType],
      minItems: 1,
      maxItems: 4,
    },
    anything: {
      type: 'composition',
      allowedTypes: ['*'],
    },
    self: {
      type: 'composition',
      allowedTypes: ['_self'],
    },
  },
});

describe('composition properties', () => {
  const result = transformProperties(
    SidebarPageType.properties,
    SidebarPageType.key,
  ) as Record<string, any>;

  it('flattens allowedTypes and restrictedTypes to keys', () => {
    expect(result.sidebar.allowedTypes).toEqual(['HeroComponent', '_component']);
    expect(result.sidebar.restrictedTypes).toEqual(['BannerComponent']);
  });

  it('keeps the other constraints untouched', () => {
    expect(result.sidebar).toMatchObject({
      type: 'composition',
      displayName: 'Sidebar',
      minItems: 1,
      maxItems: 4,
    });
  });

  it('drops a wildcard, which the API expresses as no list at all', () => {
    expect(result.anything).toEqual({ type: 'composition' });
  });

  it('resolves `_self` to the owning content type', () => {
    expect(result.self.allowedTypes).toEqual(['SidebarPageType']);
  });

  it('is legal without any type constraints', () => {
    const Unconstrained = contentType({
      key: 'UnconstrainedPage',
      displayName: 'Unconstrained Page',
      baseType: '_page',
      properties: { sidebar: { type: 'composition' } },
    });

    expect(validateContentAreaConstraints([Unconstrained]).errors).toEqual([]);
  });
});

describe('pulling a composition property back into a model', () => {
  const pulledPage: ManifestContentType = {
    key: 'PulledPage',
    displayName: 'Pulled Page',
    baseType: '_page',
    isContract: false,
    properties: {
      sidebar: {
        type: 'composition',
        displayName: 'Sidebar',
        allowedTypes: ['HeroComponent', '_component'],
        minItems: 1,
        maxItems: 4,
      },
    },
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

  it('emits the property and imports the allowed content type', () => {
    const result = generateContentCode(pulledPage, manifest, false, new Map());

    expect(result).toMatchInlineSnapshot(`
      "import { contentType } from '@optimizely/cms-sdk';
      import { HeroComponentCT } from './HeroComponentCT';

      /**
       * Pulled Page
       */
      export const PulledPageCT = contentType({
        key: 'PulledPage',
        displayName: 'Pulled Page',
        baseType: '_page',
        properties: {
          sidebar: {
            type: 'composition',
            displayName: 'Sidebar',
            allowedTypes: [
              HeroComponentCT,
              '_component'
            ],
            minItems: 1,
            maxItems: 4
          }
        }
      });
      "
    `);
  });
});
