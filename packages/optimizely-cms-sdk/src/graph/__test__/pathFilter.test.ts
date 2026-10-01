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

  it('should pass host value through as-is', () => {
    const filter = pathScalarFilter('/page', 'https://example.com');
    expect(filter.variables.host).toBe('https://example.com');
  });

  it('should pass bare hostname through without modification', () => {
    const filter = pathScalarFilter('/page', 'example.com');
    expect(filter.variables.host).toBe('example.com');
  });

  it('should preserve host casing', () => {
    const filter = pathScalarFilter('/page', 'HTTPS://EXAMPLE.COM');
    expect(filter.variables.host).toBe('HTTPS://EXAMPLE.COM');
  });

  it('should preserve trailing slash in host', () => {
    const filter = pathScalarFilter('/page', 'https://example.com/');
    expect(filter.variables.host).toBe('https://example.com/');
  });

  it('should preserve port numbers in host', () => {
    const filter = pathScalarFilter('/page', 'https://example.com:8080');
    expect(filter.variables.host).toBe('https://example.com:8080');
  });

  it('should preserve path segments in host', () => {
    const filter = pathScalarFilter('/page', 'https://example.com/site1');
    expect(filter.variables.host).toBe('https://example.com/site1');
  });

  it('should omit host variable when host is empty or undefined', () => {
    for (const host of ['', undefined]) {
      const filter = pathScalarFilter('/page', host);
      expect(filter.variables.host).toBeUndefined();
    }
  });
});
