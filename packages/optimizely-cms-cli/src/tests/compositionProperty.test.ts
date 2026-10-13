import { describe, it, expect } from 'vitest';
import { contentType } from '@optimizely/cms-sdk';
import { transformProperties, validateContentAreaConstraints } from '../utils/mapping.js';
import { generateContentCode } from '../utils/generate.js';
import { Manifest, ManifestContentType } from '../utils/manifest.js';
import { HeroComponentType, BannerComponentType } from './fixtures.js';

/**
 * A composition property needs nothing but a `format`. `allowedTypes` and
 * `restrictedTypes` are optional; when declared they are flattened to content
 * type keys like any other type constraint.
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
    },
    anything: {
      type: 'composition',
      format: 'outline',
    },
  },
});

describe('composition properties', () => {
  const result = transformProperties(
    SidebarPageType.properties,
    SidebarPageType.key,
  ) as Record<string, any>;

  it('passes the property through untouched', () => {
    expect(result.sidebar).toEqual({
      type: 'composition',
      format: 'grid',
      displayName: 'Sidebar',
    });
  });

  it('passes the format through to the API payload', () => {
    expect(result.anything).toEqual({ type: 'composition', format: 'outline' });
  });

  it('needs no type constraints to be valid', () => {
    expect(validateContentAreaConstraints([SidebarPageType]).errors).toEqual([]);
  });

  it('flattens the optional type constraints to keys', () => {
    // They control what an editor may place in the composition, so they must
    // reach the API as content type keys, like any other type constraint.
    const constrained = {
      sidebar: {
        type: 'composition',
        format: 'grid',
        allowedTypes: [HeroComponentType, '_component'],
        restrictedTypes: [BannerComponentType],
      },
    };

    expect(transformProperties(constrained, 'SidebarPageType')).toEqual({
      sidebar: {
        type: 'composition',
        format: 'grid',
        allowedTypes: ['HeroComponent', '_component'],
        restrictedTypes: ['BannerComponent'],
      },
    });
  });

  it('drops a wildcard, which the API expresses as no list at all', () => {
    expect(
      transformProperties(
        { sidebar: { type: 'composition', format: 'grid', allowedTypes: ['*'] } },
        'SidebarPageType',
      ),
    ).toEqual({ sidebar: { type: 'composition', format: 'grid' } });
  });

  it('resolves `_self` to the owning content type', () => {
    const result = transformProperties(
      { sidebar: { type: 'composition', format: 'grid', allowedTypes: ['_self'] } },
      'SidebarPageType',
    ) as Record<string, any>;

    expect(result.sidebar.allowedTypes).toEqual(['SidebarPageType']);
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
            ]
          }
        }
      });
      "
    `);
  });
});
