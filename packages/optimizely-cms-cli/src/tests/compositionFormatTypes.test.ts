import { describe, it, expect } from 'vitest';
import { contentType } from '@optimizely/cms-sdk';
import { validateContentAreaConstraints } from '../utils/mapping.js';

/**
 * The two layouts hold different things, so `format` decides which types
 * `allowedTypes` may name. The CMS rejects a mismatch on push with
 * `The type 'X' cannot be used in a 'grid' layout composition.`; these checks
 * report it before the request.
 *
 * Each case here mirrors one verified against the CMS REST API.
 */

const Element = contentType({
  key: 'NoticeElement',
  displayName: 'Notice Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
});

const Section = contentType({
  key: 'HeroSection',
  displayName: 'Hero Section',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled'],
});

const Both = contentType({
  key: 'Flexible',
  displayName: 'Flexible',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled', 'sectionEnabled'],
});

const experience = (composition?: any, sidebar?: any) =>
  ({
    key: 'ProductPage',
    displayName: 'Product Page',
    baseType: '_experience',
    ...(composition ? { composition } : {}),
    properties: sidebar ? { sidebar } : {},
  }) as any;

const errorsFor = (...cts: any[]) =>
  validateContentAreaConstraints([Element, Section, Both, ...cts]).errors;

describe('the built-in composition', () => {
  it('rejects an element type in an outline layout', () => {
    expect(
      errorsFor(experience({ format: 'outline', allowedTypes: [Element] })),
    ).toEqual([
      'Content type "ProductPage", built-in composition: "NoticeElement" cannot be used in a "outline" layout composition, which holds sections. Use "format": "grid", or allow a type that is valid in a "outline" layout.',
    ]);
  });

  it('rejects a section type in a grid layout', () => {
    expect(errorsFor(experience({ format: 'grid', allowedTypes: [Section] }))).toEqual([
      'Content type "ProductPage", built-in composition: "HeroSection" cannot be used in a "grid" layout composition, which holds elements. Use "format": "outline", or allow a type that is valid in a "grid" layout.',
    ]);
  });

  it('accepts the matching pairings', () => {
    expect(errorsFor(experience({ format: 'grid', allowedTypes: [Element] }))).toEqual([]);
    expect(errorsFor(experience({ format: 'outline', allowedTypes: [Section] }))).toEqual(
      [],
    );
  });

  it('accepts a type usable as either', () => {
    expect(errorsFor(experience({ format: 'grid', allowedTypes: [Both] }))).toEqual([]);
    expect(errorsFor(experience({ format: 'outline', allowedTypes: [Both] }))).toEqual([]);
  });
});

describe('base types in allowedTypes', () => {
  it('allows `_component` in either layout', () => {
    expect(errorsFor(experience({ format: 'grid', allowedTypes: ['_component'] }))).toEqual(
      [],
    );
    expect(
      errorsFor(experience({ format: 'outline', allowedTypes: ['_component'] })),
    ).toEqual([]);
  });

  it('allows `_section` only in an outline', () => {
    expect(
      errorsFor(experience({ format: 'outline', allowedTypes: ['_section'] })),
    ).toEqual([]);
    expect(errorsFor(experience({ format: 'grid', allowedTypes: ['_section'] }))).toEqual([
      'Content type "ProductPage", built-in composition: "_section" cannot be used in a "grid" layout composition, which holds elements. Use "format": "outline", or allow a type that is valid in a "grid" layout.',
    ]);
  });
});

describe('composition properties follow the same rule', () => {
  it('reports the property by name', () => {
    expect(
      errorsFor(
        experience(undefined, {
          type: 'composition',
          format: 'outline',
          allowedTypes: [Element],
        }),
      ),
    ).toEqual([
      'Content type "ProductPage", property "sidebar" (composition): "NoticeElement" cannot be used in a "outline" layout composition, which holds sections. Use "format": "grid", or allow a type that is valid in a "outline" layout.',
    ]);
  });
});

describe('what is deliberately not checked', () => {
  it('leaves `restrictedTypes` alone, which the CMS accepts either way', () => {
    expect(
      errorsFor(experience({ format: 'outline', restrictedTypes: [Element] })),
    ).toEqual([]);
    expect(errorsFor(experience({ format: 'grid', restrictedTypes: [Section] }))).toEqual(
      [],
    );
  });

  it('leaves an absent format alone, where the base type default applies', () => {
    expect(errorsFor(experience({ allowedTypes: [Element] }))).toEqual([]);
  });

  it('leaves a type this configuration does not define to the CMS', () => {
    expect(
      errorsFor(experience({ format: 'grid', allowedTypes: ['SomethingExternal'] })),
    ).toEqual([]);
  });
});

describe('a type no layout can hold', () => {
  // A component with no `compositionBehaviors` is neither an element nor a
  // section, so it is invalid in both layouts. Pointing at the other format
  // would not help, so the message says what to declare instead.
  const Plain = contentType({
    key: 'PlainComponent',
    displayName: 'Plain Component',
    baseType: '_component',
  });

  const errorsWith = (format: string) =>
    validateContentAreaConstraints([
      Plain,
      {
        key: 'ProductPage',
        displayName: 'Product Page',
        baseType: '_experience',
        composition: { format, allowedTypes: [Plain] },
        properties: {},
      } as any,
    ]).errors;

  it('is reported rather than skipped', () => {
    expect(errorsWith('grid')).toEqual([
      'Content type "ProductPage", built-in composition: "PlainComponent" cannot be used in any composition. Declare "compositionBehaviors": ["elementEnabled"] on it to allow it in a "grid", or ["sectionEnabled"] to allow it in an "outline".',
    ]);
  });

  it('is reported for either layout', () => {
    expect(errorsWith('outline')).toEqual(errorsWith('grid'));
  });
});

describe('where a composition property may be declared', () => {
  const Element = contentType({
    key: 'CardEl',
    displayName: 'Card',
    baseType: '_component',
    compositionBehaviors: ['elementEnabled'],
  });

  const composition = { type: 'composition', format: 'grid' };

  const errorsFor = (ct: any) =>
    validateContentAreaConstraints([Element, ct]).errors;

  it('rejects one on a page', () => {
    expect(
      errorsFor({
        key: 'Article',
        displayName: 'Article',
        baseType: '_page',
        properties: { sidebar: composition },
      }),
    ).toEqual([
      'Content type "Article", property "sidebar" (composition): a composition property is only supported on an "_experience" content type, not "_page". Use a content area ("type": "array" of "type": "content") instead.',
    ]);
  });

  it('rejects one on a section, which keeps its inherited built-in composition', () => {
    expect(
      errorsFor({
        key: 'HeroSection',
        displayName: 'Hero Section',
        baseType: '_section',
        properties: { extra: composition },
      })[0],
    ).toContain('only supported on an "_experience" content type, not "_section"');
  });

  it('rejects the reserved key `composition`', () => {
    expect(
      errorsFor({
        key: 'ProductPage',
        displayName: 'Product Page',
        baseType: '_experience',
        properties: { composition },
      }),
    ).toEqual([
      'Content type "ProductPage": the property name "composition" is reserved for the built-in composition. Give the property another key, or configure the built-in one with "composition" beside "properties".',
    ]);
  });

  it('rejects an array of compositions', () => {
    expect(
      errorsFor({
        key: 'ProductPage',
        displayName: 'Product Page',
        baseType: '_experience',
        properties: { sidebars: { type: 'array', items: composition } },
      }),
    ).toEqual([
      'Content type "ProductPage", property "sidebars" (composition): a composition cannot be an array item. Declare "type": "composition" on the property itself.',
    ]);
  });

  it('accepts one on an experience under any other key', () => {
    expect(
      errorsFor({
        key: 'ProductPage',
        displayName: 'Product Page',
        baseType: '_experience',
        properties: { sidebar: composition },
      }),
    ).toEqual([]);
  });
});
