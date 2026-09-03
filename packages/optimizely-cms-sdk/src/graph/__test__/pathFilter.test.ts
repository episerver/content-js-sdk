import { describe, it, expect } from 'vitest';
import { pathScalarFilter } from '../filters.js';

describe('pathScalarFilter', () => {
  it('should return by-path shape with both slash variants', () => {
    const filter = pathScalarFilter('/en/blog/my-article/');

    expect(filter.filterShape).toBe('by-path');
    expect(filter.variables).toEqual({
      path: '/en/blog/my-article/',
      pathNoSlash: '/en/blog/my-article',
    });
  });

  it('should return by-path shape when host is provided', () => {
    const filter = pathScalarFilter('/my-article', 'https://example.com');

    expect(filter.filterShape).toBe('by-path');
    expect(filter.variables).toEqual({
      path: '/my-article/',
      pathNoSlash: '/my-article',
      host: 'https://example.com',
    });
  });

  it('should handle path without trailing slash', () => {
    const filter = pathScalarFilter('/en/blog');

    expect(filter.variables.path).toBe('/en/blog/');
    expect(filter.variables.pathNoSlash).toBe('/en/blog');
  });

  it('should produce both slash variants for a simple path', () => {
    const filter = pathScalarFilter('/my-article');

    expect(filter.variables.path).toBe('/my-article/');
    expect(filter.variables.pathNoSlash).toBe('/my-article');
  });
});
