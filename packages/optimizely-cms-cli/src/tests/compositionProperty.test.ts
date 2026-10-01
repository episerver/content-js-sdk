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
  baseType: '_experience',
  properties: {
    sidebar: {
      type: 'composition',
      format: 'grid',
      displayName: 'Sidebar',
      allowedTypes: [HeroComponentType, '_component'],
      restrictedTypes: [BannerComponentType],
      minItems: 1,
      maxItems: 4,
    },
    anything: {
      type: 'composition',
      format: 'outline',
      allowedTypes: ['*'],
    },
    self: {
      type: 'composition',
      format: 'grid',
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
      format: 'grid',
      displayName: 'Sidebar',
      minItems: 1,
      maxItems: 4,
    });
  });

  it('passes the format through to the API payload', () => {
    expect(result.anything.format).toBe('outline');
  });

  it('drops a wildcard, which the API expresses as no list at all', () => {
    expect(result.anything).toEqual({ type: 'composition', format: 'outline' });
  });

  it('resolves `_self` to the owning content type', () => {
    expect(result.self.allowedTypes).toEqual(['SidebarPageType']);
  });

  it('is legal without any type constraints', () => {
    const Unconstrained = contentType({
      key: 'UnconstrainedExperience',
      displayName: 'Unconstrained Experience',
      baseType: '_experience',
      properties: { sidebar: { type: 'composition', format: 'grid' } },
    });

    expect(validateContentAreaConstraints([Unconstrained]).errors).toEqual([]);
  });
});

/**
 * TypeScript already makes `format` mandatory, so these only reach the validator
 * from a plain JS config or a cast — which is exactly what `push` has to survive.
 */
describe('validating the composition format', () => {
  const experienceWith = (sidebar: unknown) =>
    ({
      key: 'SomeExperience',
      displayName: 'Some Experience',
      baseType: '_experience',
      properties: { sidebar },
    }) as any;

  it('accepts every known format', () => {
    for (const format of ['grid', 'outline']) {
      const errors = validateContentAreaConstraints([
        experienceWith({ type: 'composition', format }),
      ]).errors;

      expect(errors).toEqual([]);
    }
  });

  it('reports a missing format', () => {
    const { errors } = validateContentAreaConstraints([
      experienceWith({ type: 'composition' }),
    ]);

    expect(errors).toEqual([
      'Content type "SomeExperience", property "sidebar" (composition): missing "format". Declare "grid" or "outline".',
    ]);
  });

  it('reports an unknown format', () => {
    const { errors } = validateContentAreaConstraints([
      experienceWith({ type: 'composition', format: 'stack' }),
    ]);

    expect(errors).toEqual([
      'Content type "SomeExperience", property "sidebar" (composition): invalid "format" "stack". Must be "grid" or "outline".',
    ]);
  });

  it('leaves any other `format` alone on other property types', () => {
    const { errors } = validateContentAreaConstraints([
      experienceWith({ type: 'string', format: 'html', displayName: 'Plain' }),
    ]);

    expect(errors).toEqual([]);
  });

  it('reserves the composition formats for composition properties', () => {
    const { errors } = validateContentAreaConstraints([
      experienceWith({ type: 'string', format: 'grid' }),
    ]);

    expect(errors).toEqual([
      'Content type "SomeExperience", property "sidebar" (string): "format" "grid" is reserved for composition properties. Use "type": "composition", or choose a different format.',
    ]);
  });

  it('reserves them inside array items too', () => {
    const { errors } = validateContentAreaConstraints([
      experienceWith({ type: 'array', items: { type: 'string', format: 'outline' } }),
    ]);

    expect(errors).toEqual([
      'Content type "SomeExperience", property "sidebar" (string): "format" "outline" is reserved for composition properties. Use "type": "composition", or choose a different format.',
    ]);
  });
});

describe('pulling a composition property back into a model', () => {
  const pulledPage: ManifestContentType = {
    key: 'PulledExperience',
    displayName: 'Pulled Experience',
    baseType: '_experience',
    isContract: false,
    properties: {
      sidebar: {
        type: 'composition',
        format: 'grid',
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
       * Pulled Experience
       */
      export const PulledExperienceCT = contentType({
        key: 'PulledExperience',
        displayName: 'Pulled Experience',
        baseType: '_experience',
        properties: {
          sidebar: {
            type: 'composition',
            format: 'grid',
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
