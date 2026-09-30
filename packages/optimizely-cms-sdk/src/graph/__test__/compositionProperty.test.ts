import { describe, expect, test, beforeEach } from 'vitest';
import { createFragment } from '../createQuery.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { createQueryContext, refreshCache } from '../../util/queryUtils.js';

/**
 * A content type can declare composition properties of its own, next to (or
 * instead of) the built-in `composition` an experience gets for free. They hold
 * a node tree, so they select `ICompositionNode` rather than a union of the
 * content types they allow.
 */

const Element = contentType({
  key: 'PlainElement',
  displayName: 'Plain Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: { heading: { type: 'string' } },
});

const OtherElement = contentType({
  key: 'OtherElement',
  displayName: 'Other Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: { label: { type: 'string' } },
});

/** An ordinary page, with a composition property but no built-in composition. */
const Page = contentType({
  key: 'SidebarPage',
  displayName: 'Sidebar Page',
  baseType: '_page',
  properties: {
    sidebar: { type: 'composition', allowedTypes: ['_component'] },
  },
});

/** An experience holding both the built-in composition and a custom one. */
const Experience = contentType({
  key: 'HostExperience',
  displayName: 'Host Experience',
  baseType: '_experience',
  properties: {
    sidebar: { type: 'composition', allowedTypes: ['_component'] },
  },
});

/** Restrictions must not change the fragments, only what the CMS accepts. */
const RestrictedPage = contentType({
  key: 'RestrictedPage',
  displayName: 'Restricted Page',
  baseType: '_page',
  properties: {
    sidebar: {
      type: 'composition',
      allowedTypes: ['PlainElement'],
      restrictedTypes: ['OtherElement'],
    },
  },
});

/** The built-in composition, restricted through the reserved key. */
const OverriddenExperience = contentType({
  key: 'OverriddenExperience',
  displayName: 'Overridden Experience',
  baseType: '_experience',
  properties: {
    composition: { type: 'composition', allowedTypes: ['PlainElement'] },
  },
});

const fragmentsFor = (key: string): string[] =>
  createFragment(key, new Set(), '', createQueryContext({ maxThreshold: 100 })).fragments;

const fragmentFor = (fragments: string[], key: string) =>
  fragments.find(f => f.startsWith(`fragment ${key} on`)) ?? '';

const countOf = (fragments: string[], key: string) =>
  fragments.filter(f => f.startsWith(`fragment ${key} on`)).length;

beforeEach(() => {
  initContentTypeRegistry([
    Page,
    Experience,
    RestrictedPage,
    OverriddenExperience,
    Element,
    OtherElement,
  ]);
  refreshCache();
});

describe('a composition property', () => {
  test('selects composition nodes, not a content union', () => {
    const fragments = fragmentsFor('SidebarPage');

    expect(fragmentFor(fragments, 'SidebarPage')).toContain(
      'SidebarPage__sidebar:sidebar { ...ICompositionNode }',
    );
    expect(fragmentFor(fragments, 'SidebarPage')).not.toContain(
      'SidebarPage__sidebar:sidebar { __typename',
    );
  });

  test('brings the composition element fragments with it', () => {
    const fragments = fragmentsFor('SidebarPage');

    expect(fragmentFor(fragments, 'ICompositionNode')).toContain('..._IComponent');
    expect(fragmentFor(fragments, '_IComponent')).toContain('...PlainElement');
    expect(fragmentFor(fragments, '_IComponent')).toContain('...OtherElement');
  });

  test('leaves out _IExperience, which nothing spreads', () => {
    const fragments = fragmentsFor('SidebarPage');

    expect(countOf(fragments, '_IExperience')).toBe(0);
  });

  test('keeps every element type regardless of restrictions', () => {
    const restricted = fragmentFor(fragmentsFor('RestrictedPage'), '_IComponent');

    expect(restricted).toContain('...PlainElement');
    expect(restricted).toContain('...OtherElement');
  });
});

describe('alongside the built-in composition', () => {
  test('an experience fetches both', () => {
    const experience = fragmentFor(fragmentsFor('HostExperience'), 'HostExperience');

    expect(experience).toContain('..._IExperience');
    expect(experience).toContain(
      'HostExperience__sidebar:sidebar { ...ICompositionNode }',
    );
  });

  test('the shared fragments are emitted once', () => {
    const fragments = fragmentsFor('HostExperience');

    expect(countOf(fragments, 'ICompositionNode')).toBe(1);
    expect(countOf(fragments, '_IComponent')).toBe(1);
    expect(countOf(fragments, '_IExperience')).toBe(1);
  });

  test('overriding the reserved key still queries the built-in field', () => {
    const fragments = fragmentsFor('OverriddenExperience');
    const experience = fragmentFor(fragments, 'OverriddenExperience');

    // `..._IExperience` selects `composition`; the property must not also emit
    // an aliased duplicate, which would fetch the whole node tree twice.
    expect(experience).toContain('..._IExperience');
    expect(experience).not.toContain('OverriddenExperience__composition');
    expect(countOf(fragments, 'ICompositionNode')).toBe(1);
  });

  test('a section restricting its own composition fetches it once', () => {
    const Section = contentType({
      key: 'RestrictedSection',
      displayName: 'Restricted Section',
      baseType: '_component',
      compositionBehaviors: ['sectionEnabled'],
      properties: {
        composition: { type: 'composition', allowedTypes: ['PlainElement'] },
      },
    });
    initContentTypeRegistry([Section, Element]);
    refreshCache();

    const section = fragmentFor(fragmentsFor('RestrictedSection'), 'RestrictedSection');

    expect(section).toContain('composition { ...ICompositionNode }');
    expect(section).not.toContain('RestrictedSection__composition');
  });
});

describe('backward compatibility', () => {
  test('an experience without composition properties is unchanged', () => {
    const Plain = contentType({
      key: 'PlainExperience',
      displayName: 'Plain Experience',
      baseType: '_experience',
      properties: { heading: { type: 'string' } },
    });
    initContentTypeRegistry([Plain, Element]);
    refreshCache();

    const fragments = fragmentsFor('PlainExperience');

    expect(fragmentFor(fragments, 'PlainExperience')).toContain('..._IExperience');
    expect(fragmentFor(fragments, '_IExperience')).toContain(
      'composition {...ICompositionNode }',
    );
  });
});
