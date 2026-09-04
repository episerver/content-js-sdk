import { describe, it, expect } from 'vitest';
import { pathScalarFilter, normalizeHost } from '../filters.js';

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

  it('should normalize host values with scheme', () => {
    const variations: [string, string][] = [
      ['example.com', 'https://example.com'],
      ['https://example.com', 'https://example.com'],
      ['http://example.com', 'http://example.com'],
      ['HTTPS://EXAMPLE.COM', 'https://example.com'],
      ['https://example.com/', 'https://example.com'],
      ['HTTPS://EXAMPLE.COM/', 'https://example.com'],
      ['HTTP://EXAMPLE.COM/', 'http://example.com'],
    ];

    for (const [host, expected] of variations) {
      const filter = pathScalarFilter('/page', host);
      expect(filter.variables.host).toBe(expected);
    }
  });

  it('should preserve port numbers in host', () => {
    const filter = pathScalarFilter('/page', 'example.com:8080');
    expect(filter.variables.host).toBe('https://example.com:8080');
  });

  it('should preserve path segments in host', () => {
    const filter = pathScalarFilter('/page', 'https://example.com/site1');
    expect(filter.variables.host).toBe('https://example.com/site1');
  });

  it('should omit host variable for empty or whitespace host', () => {
    for (const host of ['', '  ', undefined]) {
      const filter = pathScalarFilter('/page', host);
      expect(filter.variables.host).toBeUndefined();
    }
  });
});

describe('normalizeHost', () => {
  it('should return undefined for undefined input', () => {
    expect(normalizeHost(undefined)).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    expect(normalizeHost('')).toBeUndefined();
  });

  it('should return undefined for whitespace-only string', () => {
    expect(normalizeHost('   ')).toBeUndefined();
  });

  it('should prepend https:// to bare domain', () => {
    expect(normalizeHost('example.com')).toBe('https://example.com');
  });

  it('should preserve https:// scheme', () => {
    expect(normalizeHost('https://example.com')).toBe('https://example.com');
  });

  it('should preserve http:// scheme', () => {
    expect(normalizeHost('http://example.com')).toBe('http://example.com');
  });

  it('should preserve other schemes', () => {
    expect(normalizeHost('ftp://example.com')).toBe('ftp://example.com');
  });

  it('should strip trailing slash', () => {
    expect(normalizeHost('https://example.com/')).toBe('https://example.com');
  });

  it('should strip multiple trailing slashes', () => {
    expect(normalizeHost('https://example.com///')).toBe('https://example.com');
  });

  it('should lowercase the host', () => {
    expect(normalizeHost('HTTPS://EXAMPLE.COM')).toBe('https://example.com');
  });

  it('should handle combined normalization', () => {
    expect(normalizeHost('HTTP://EXAMPLE.COM/')).toBe('http://example.com');
  });

  it('should preserve port numbers', () => {
    expect(normalizeHost('example.com:8080')).toBe('https://example.com:8080');
  });

  it('should preserve path segments', () => {
    expect(normalizeHost('https://example.com/site1')).toBe('https://example.com/site1');
  });

  it('should preserve www prefix', () => {
    expect(normalizeHost('HTTPS://WWW.EXAMPLE.COM/')).toBe('https://www.example.com');
  });

  it('should be idempotent', () => {
    const once = normalizeHost('example.com');
    const twice = normalizeHost(once);
    expect(twice).toBe(once);
  });

  it('should be idempotent for scheme-prefixed input', () => {
    const once = normalizeHost('https://www.example.com');
    const twice = normalizeHost(once);
    expect(twice).toBe(once);
  });
});
