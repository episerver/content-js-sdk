import { test } from 'vitest';
import { contentType, contract } from '../index.js';

test('contract cannot have baseType field', () => {
  contract({
    key: 'test',
    displayName: 'Test',
    // @ts-expect-error - baseType is never allowed on contracts
    baseType: '_page',
  });
});

test('nested arrays are prevented', () => {
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      nested: {
        type: 'array',
        items: {
          // @ts-expect-error - nested arrays not allowed, inner type cannot be 'array'
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  });
});

test('component property requires contentType field', () => {
  const Hero = contentType({
    key: 'hero',
    displayName: 'Hero',
    baseType: '_component',
  });

  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      hero: {
        type: 'component',
        contentType: Hero,
      },
    },
  });

  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      // @ts-expect-error - contentType field is required for component properties
      hero: {
        type: 'component',
      },
    },
  });
});

test('compositionBehaviors allowed on component type', () => {
  contentType({
    key: 'component',
    displayName: 'Component',
    baseType: '_component',
    compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  });
});

test('content/contentReference require allowedTypes or restrictedTypes', () => {
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      // @ts-expect-error - contentReference requires either allowedTypes or restrictedTypes
      ref: { type: 'contentReference' },
    },
  });

  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      // @ts-expect-error - content requires either allowedTypes or restrictedTypes
      area: { type: 'content' },
    },
  });

  // Valid with allowedTypes
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      ref: { type: 'contentReference', allowedTypes: ['*'] },
    },
  });

  // Valid with restrictedTypes
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      area: { type: 'content', restrictedTypes: [] },
    },
  });

  // Valid with both
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      ref: {
        type: 'contentReference',
        allowedTypes: ['_component'],
        restrictedTypes: ['other'],
      },
    },
  });
});

test('contentReference accepts contentType field with ContentType value', () => {
  const Article = contentType({
    key: 'article',
    displayName: 'Article',
    baseType: '_component',
  });

  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      ref: {
        type: 'contentReference',
        displayName: 'Content Reference',
        contentType: Article,
      },
    },
  });
});

test('content accepts contentType field with ContentType value', () => {
  const Article = contentType({
    key: 'article',
    displayName: 'Article',
    baseType: '_component',
  });

  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      area: {
        type: 'content',
        displayName: 'Content Area',
        contentType: Article,
      },
    },
  });
});

test('composition accepts optional allowedTypes and restrictedTypes', () => {
  const Card = contentType({
    key: 'card',
    displayName: 'Card',
    baseType: '_component',
    compositionBehaviors: ['elementEnabled'],
  });

  contentType({
    key: 'experience',
    displayName: 'Experience',
    baseType: '_experience',
    properties: {
      sidebar: {
        type: 'composition',
        format: 'grid',
        displayName: 'Sidebar',
        allowedTypes: [Card, '_component'],
        restrictedTypes: ['Deprecated'],
      },
    },
  });
});

test('composition needs no type constraints at all', () => {
  // Unlike a content area, an unconstrained composition is legal: every type
  // that may appear in a composition is allowed in it.
  contentType({
    key: 'experience',
    displayName: 'Experience',
    baseType: '_experience',
    properties: {
      sidebar: { type: 'composition', format: 'grid' },
    },
  });
});

test('composition requires a format, and only a known one', () => {
  contentType({
    key: 'experience',
    displayName: 'Experience',
    baseType: '_experience',
    properties: {
      outlined: { type: 'composition', format: 'outline' },
    },
  });

  contentType({
    key: 'experience',
    displayName: 'Experience',
    baseType: '_experience',
    properties: {
      // @ts-expect-error - format is mandatory on a composition property
      sidebar: { type: 'composition', displayName: 'Sidebar' },
    },
  });

  contentType({
    key: 'experience',
    displayName: 'Experience',
    baseType: '_experience',
    properties: {
      // @ts-expect-error - 'stack' is not one of COMPOSITION_FORMATS
      sidebar: { type: 'composition', format: 'stack' },
    },
  });
});

test('the built-in composition is configured beside the properties', () => {
  const Card = contentType({
    key: 'card',
    displayName: 'Card',
    baseType: '_component',
    compositionBehaviors: ['elementEnabled'],
  });

  contentType({
    key: 'experience',
    displayName: 'Experience',
    baseType: '_experience',
    composition: {
      format: 'grid',
      allowedTypes: [Card, '_component'],
      restrictedTypes: ['Deprecated'],
    },
  });

  // A section has the same canvas, and every field is optional
  contentType({
    key: 'section',
    displayName: 'Section',
    baseType: '_section',
    composition: { allowedTypes: [Card] },
  });
});

test('the built-in composition takes only a known format', () => {
  contentType({
    key: 'experience',
    displayName: 'Experience',
    baseType: '_experience',
    // @ts-expect-error - 'stack' is not one of COMPOSITION_FORMATS
    composition: { format: 'stack' },
  });
});

/**
 * Where a composition may be declared, verified against the CMS REST API:
 *
 * | owner                          | property          | `composition` config |
 * | ------------------------------ | ----------------- | -------------------- |
 * | `_experience`                  | yes, any key      | yes                  |
 * | `_section`                     | no                | yes                  |
 * | `_component` + sectionEnabled  | only key `composition` | no              |
 * | `_page` / media / `_folder`    | no                | no                   |
 * | contract                       | no                | no                   |
 */
test('a composition property is rejected on owners the CMS refuses', () => {
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      // @ts-expect-error - only an `_experience` may declare a composition property
      sidebar: { type: 'composition', format: 'grid' },
    },
  });

  contentType({
    key: 'section',
    displayName: 'Section',
    baseType: '_section',
    properties: {
      // @ts-expect-error - a section keeps the built-in composition it inherits
      sidebar: { type: 'composition', format: 'grid' },
    },
  });

  contentType({
    key: 'image',
    displayName: 'Image',
    baseType: '_image',
    properties: {
      // @ts-expect-error - a media type has no composition
      sidebar: { type: 'composition', format: 'grid' },
    },
  });

  contentType({
    key: 'folder',
    displayName: 'Folder',
    baseType: '_folder',
    properties: {
      // @ts-expect-error - a folder has no composition
      sidebar: { type: 'composition', format: 'grid' },
    },
  });

  contract({
    key: 'seo',
    displayName: 'SEO',
    properties: {
      // @ts-expect-error - a contract cannot carry a composition to its implementors
      sidebar: { type: 'composition', format: 'grid' },
    },
  });
});

test('an experience may declare one, and a section-enabled component the inherited key', () => {
  contentType({
    key: 'experience',
    displayName: 'Experience',
    baseType: '_experience',
    properties: {
      sidebar: { type: 'composition', format: 'grid' },
    },
  });

  // The one case the CMS allows outside an experience: a `sectionEnabled`
  // component modelling the canvas it inherits, under the reserved key.
  contentType({
    key: 'heroSection',
    displayName: 'Hero Section',
    baseType: '_component',
    compositionBehaviors: ['sectionEnabled'],
    properties: {
      composition: { type: 'composition', format: 'grid' },
    },
  });
});

test('a contract cannot configure a built-in composition either', () => {
  contract({
    key: 'seo',
    displayName: 'SEO',
    // @ts-expect-error - a contract has no base type, so it has no composition
    composition: { format: 'grid' },
    properties: { title: { type: 'string' } },
  });
});

test('the composition config is rejected on owners that have no canvas', () => {
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    // @ts-expect-error - a page has no built-in composition
    composition: { format: 'grid' },
  });

  contentType({
    key: 'comp',
    displayName: 'Comp',
    baseType: '_component',
    // @ts-expect-error - a component has no built-in composition
    composition: { format: 'grid' },
  });

  contentType({
    key: 'image',
    displayName: 'Image',
    baseType: '_image',
    // @ts-expect-error - a media type has no built-in composition
    composition: { format: 'grid' },
  });
});
