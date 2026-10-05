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
