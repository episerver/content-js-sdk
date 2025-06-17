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
import { contentType, initContentTypeRegistry } from '../../model';
import { createFragment } from '../createQuery';

describe('createFragment > Fragment threshold warning', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}); // mocks the console.warn method
  const originalEnv = process.env; // Store original environment variables

  // Create a large number of child content types to trigger the fragment threshold warning
  const childTypes = Array.from({ length: 101 }).map((_, i) =>
    contentType({
      key: `Type${i}`,
      baseType: 'component',
      displayName: `Type ${i}`,
      properties: {},
    })
  );

  // Root content type that includes all child types in its content area
  const rootType = contentType({
    key: 'ExplodingType',
    baseType: 'page',
    displayName: 'Exploding Type',
    properties: {
      contentArea: {
        type: 'content',
      },
    },
    compositionBehaviors: ['sectionEnabled'],
  });

  beforeAll(() => {
    // Initialize the content type registry with the root and child types
    initContentTypeRegistry([rootType, ...childTypes]);
  });

  beforeEach(() => {
    // Reset the environment variable to ensure the threshold is set for the test
    // This simulates the environment where MAX_FRAGMENT_THRESHOLD is set to 100
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

  it('should log a warning when fragment count exceeds threshold', () => {
    const result = createFragment('ExplodingType');
    expect(result).toBeInstanceOf(Array);
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toMatch(
      String.raw`generated 101 inner fragments`
    );
    expect(warnSpy.mock.calls[0][0]).toMatch(
      /Excessive fragment depth may breach GraphQL limits or degrade performance./
    );
  });

  it('should not log a warning when fragment count is within threshold', () => {
    const minimalType = contentType({
      key: 'SafeType',
      baseType: 'page',
      displayName: 'Safe Type',
      properties: {
        section: {
          type: 'content',
          allowedTypes: [childTypes[0]],
        },
      },
    });

    initContentTypeRegistry([minimalType, childTypes[0]]);
    const result = createFragment('SafeType');
    expect(result).toBeInstanceOf(Array);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
