import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
  afterAll,
} from 'vitest';
import { createQueryContext } from '../../util/queryUtils.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { createFragment } from '../createQuery.js';
import { GraphFragmentThresholdError } from '../error.js';
import { ComponentRegistry } from '../../render/componentRegistry.js';

describe('createFragment > Fragment threshold enforcement', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const originalEnv = process.env;

  const childTypes = Array.from({ length: 101 }).map((_, i) =>
    contentType({
      key: `Type${i}`,
      baseType: '_component',
      displayName: `Type ${i}`,
      properties: {
        [`title_${i}`]: {
          type: 'string',
        },
      },
    }),
  );

  const rootType = contentType({
    key: 'ExplodingType',
    baseType: '_page',
    displayName: 'Exploding Type',
    properties: {
      contentArea: {
        type: 'content',
        restrictedTypes: [],
      },
    },
  });

  beforeAll(() => {
    initContentTypeRegistry([rootType, ...childTypes]);
  });

  beforeEach(() => {
    process.env = { ...originalEnv, MAX_FRAGMENT_THRESHOLD: '100' };
    warnSpy.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    warnSpy.mockReset();
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it('should throw GraphFragmentThresholdError when fragment count exceeds threshold', () => {
    expect(() => createFragment('ExplodingType')).toThrow(GraphFragmentThresholdError);
  });

  it('should include correct metadata in the thrown error', () => {
    try {
      createFragment('ExplodingType');
      expect.fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphFragmentThresholdError);
      const e = error as GraphFragmentThresholdError;
      expect(e.contentType).toBe('ExplodingType');
      expect(e.fragmentCount).toBeGreaterThan(100);
      expect(e.threshold).toBe(100);
    }
  });

  it('should not throw when fragment count is within threshold', () => {
    const minimalType = contentType({
      key: 'SafeType',
      baseType: '_page',
      displayName: 'Safe Type',
      properties: {
        section: {
          type: 'content',
          allowedTypes: [childTypes[0]],
        },
      },
    });

    initContentTypeRegistry([minimalType, childTypes[0]]);
    expect(() => createFragment('SafeType')).not.toThrow();
  });

  it('should respect custom maxFragmentThreshold', () => {
    initContentTypeRegistry([rootType, ...childTypes]);

    expect(() =>
      createFragment(
        'ExplodingType',
        new Set(),
        '',
        createQueryContext({ maxFragmentThreshold: 200 }),
      ),
    ).not.toThrow();
  });

  it('should not throw for constrained content area even with many registered types', () => {
    const constrainedType = contentType({
      key: 'ConstrainedType',
      baseType: '_page',
      displayName: 'Constrained Type',
      properties: {
        section: {
          type: 'content',
          allowedTypes: [childTypes[0], childTypes[1]],
        },
      },
    });

    initContentTypeRegistry([constrainedType, ...childTypes]);
    expect(() => createFragment('ConstrainedType')).not.toThrow();
  });

  it('should apply typeFilter to reduce fragment generation', () => {
    const allowedKeys = new Set(['Type0', 'Type1', 'Type2']);
    const typeFilter = (key: string) => allowedKeys.has(key);

    initContentTypeRegistry([rootType, ...childTypes]);
    const result = createFragment(
      'ExplodingType',
      new Set(),
      '',
      createQueryContext({ typeFilter }),
    );

    expect(result.fragments).toBeInstanceOf(Array);
    const fragmentNames = result.fragments
      .map(f => f.match(/^fragment (\w+)/)?.[1])
      .filter(Boolean);
    const childFragments = fragmentNames.filter(name => name?.startsWith('Type'));
    expect(childFragments.length).toBeLessThanOrEqual(3);
  });
});

describe('createFragment > typeFilter with ComponentRegistry integration', () => {
  const DummyComponent = () => null;

  const allTypes = Array.from({ length: 50 }).map((_, i) =>
    contentType({
      key: `Widget${i}`,
      baseType: '_component',
      displayName: `Widget ${i}`,
      properties: {
        label: { type: 'string' },
      },
    }),
  );

  const pageType = contentType({
    key: 'HomePage',
    baseType: '_page',
    displayName: 'Home Page',
    properties: {
      widgets: {
        type: 'array',
        items: {
          type: 'content',
          restrictedTypes: [],
        },
      },
    },
  });

  beforeAll(() => {
    initContentTypeRegistry([pageType, ...allTypes]);
  });

  it('should only generate fragments for types with a registered component', () => {
    const registry = new ComponentRegistry<() => null>({
      Widget0: DummyComponent,
      Widget3: DummyComponent,
      Widget7: DummyComponent,
    });

    const typeFilter = (key: string) => !!registry.getComponent(key);
    const result = createFragment(
      'HomePage',
      new Set(),
      '',
      createQueryContext({ typeFilter }),
    );

    const fragmentNames = result.fragments
      .map(f => f.match(/^fragment (\w+)/)?.[1])
      .filter(Boolean);
    const widgetFragments = fragmentNames.filter(name => name?.startsWith('Widget'));

    expect(widgetFragments).toEqual(
      expect.arrayContaining(['Widget0', 'Widget3', 'Widget7']),
    );
    expect(widgetFragments).toHaveLength(3);
  });

  it('should generate zero child fragments when no components are registered', () => {
    const registry = new ComponentRegistry<() => null>({});

    const typeFilter = (key: string) => !!registry.getComponent(key);
    const result = createFragment(
      'HomePage',
      new Set(),
      '',
      createQueryContext({ typeFilter }),
    );

    const fragmentNames = result.fragments
      .map(f => f.match(/^fragment (\w+)/)?.[1])
      .filter(Boolean);
    const widgetFragments = fragmentNames.filter(name => name?.startsWith('Widget'));

    expect(widgetFragments).toHaveLength(0);
  });

  it('should not throw when typeFilter reduces count below threshold', () => {
    const registry = new ComponentRegistry<() => null>({
      Widget0: DummyComponent,
      Widget1: DummyComponent,
    });

    const typeFilter = (key: string) => !!registry.getComponent(key);

    expect(() =>
      createFragment(
        'HomePage',
        new Set(),
        '',
        createQueryContext({ typeFilter, maxFragmentThreshold: 20 }),
      ),
    ).not.toThrow();
  });
});
