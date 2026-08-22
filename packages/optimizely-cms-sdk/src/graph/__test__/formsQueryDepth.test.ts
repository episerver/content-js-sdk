import { describe, expect, test, beforeEach } from 'vitest';
import { createFragment } from '../createQuery.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { createQueryContext, refreshCache } from '../../util/queryUtils.js';

const ExperienceType = contentType({
  key: 'FormsDepthExperience',
  displayName: 'Forms Depth Experience',
  baseType: '_experience',
  properties: {},
});

const ElementType = contentType({
  key: 'FormsDepthElement',
  displayName: 'Forms Depth Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: { heading: { type: 'string' } },
});

/** How many levels of `nodes { ... }` the composition fragment asks for. */
function compositionDepth(fragments: string[]): number {
  const composition = fragments.find(f => f.startsWith('fragment ICompositionNode'));
  if (!composition) throw new Error('no ICompositionNode fragment was generated');

  return (composition.match(/nodes \{/g) ?? []).length;
}

const depthFor = (formsEnabled: boolean) =>
  compositionDepth(
    createFragment(
      'FormsDepthExperience',
      new Set(),
      '',
      createQueryContext({
        damEnabled: false,
        maxFragmentThreshold: 100,
        expandContracts: false,
        formsEnabled,
      }),
      { includeBaseFragments: true },
    ).fragments,
  );

beforeEach(() => {
  initContentTypeRegistry([ExperienceType, ElementType]);
  refreshCache();
});

describe('shared fragments', () => {
  // `ICompositionNode` is emitted once per experience in the document. When the
  // depth became conditional, a nested experience that had lost `formsEnabled`
  // emitted a second, shallower definition under the same name, and Graph
  // rejected the query with "There can be only one fragment named".
  test('defines ICompositionNode exactly once with a nested experience', () => {
    const Nested = contentType({
      key: 'NestedExperience',
      displayName: 'Nested Experience',
      baseType: '_experience',
      properties: {},
    });

    const Host = contentType({
      key: 'HostExperience',
      displayName: 'Host Experience',
      baseType: '_experience',
      properties: {
        inner: { type: 'content', allowedTypes: ['NestedExperience'] },
      },
    });

    initContentTypeRegistry([Host, Nested, ElementType]);
    refreshCache();

    const { fragments } = createFragment(
      'HostExperience',
      new Set(),
      '',
      createQueryContext({
        damEnabled: false,
        maxFragmentThreshold: 100,
        expandContracts: false,
        formsEnabled: true,
      }),
      { includeBaseFragments: true },
    );

    const definitions = fragments.filter(f => f.startsWith('fragment ICompositionNode'));

    expect(definitions).toHaveLength(1);
    expect(new Set(definitions).size).toBe(1);
  });
});

describe('composition nesting depth', () => {
  // Forms nest deeper than an ordinary composition, but the deeper fragment used to
  // be emitted for every site whether or not Forms was enabled, lengthening every
  // query for everyone.
  test('is deeper only when forms are enabled', () => {
    expect(depthFor(true)).toBeGreaterThan(depthFor(false));
  });

  test('matches the documented depths', () => {
    expect(depthFor(false)).toBe(4);
    expect(depthFor(true)).toBe(8);
  });
});
