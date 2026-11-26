import { describe, it, expect } from 'vitest';
import { normalizeHost, pathScalarFilter } from '../filters.js';

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

describe('normalizeHost', () => {
  it.each([
    ['https://www.example.com', 'https://www.example.com'],
    ['https://www.example.com/', 'https://www.example.com'],
    ['https://www.example.com/en/page', 'https://www.example.com'],
    ['HTTPS://WWW.EXAMPLE.COM/', 'https://www.example.com'],
    ['  https://www.example.com  ', 'https://www.example.com'],
    ['www.example.com', 'https://www.example.com'],
    ['www.example.com/', 'https://www.example.com'],
    ['localhost:3000', 'https://localhost:3000'],
    ['http://localhost:3000/', 'http://localhost:3000'],
    ['https://www.example.com:443', 'https://www.example.com'],
  ])('normalizes %j to %j', (host, expected) => {
    expect(normalizeHost(host)).toBe(expected);
  });

  it.each([undefined, '', '   '])('returns undefined for %j', host => {
    expect(normalizeHost(host)).toBeUndefined();
  });

  it('passes a value that is not a URL through trimmed', () => {
    expect(normalizeHost(' not a host ')).toBe('not a host');
  });

  it('is applied to the path filter', () => {
    expect(pathScalarFilter('/page', 'WWW.Example.com/').variables.host).toBe(
      'https://www.example.com',
    );
    expect(pathScalarFilter('/page', ' ').variables).not.toHaveProperty('host');
  });
});
