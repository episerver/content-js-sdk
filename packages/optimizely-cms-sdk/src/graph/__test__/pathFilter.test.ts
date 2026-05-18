import { describe, it, expect } from 'vitest';
import { pathFilter } from '../filters.js';

describe('pathFilter', () => {
  it('should match both url.default and url.hierarchical', () => {
    const filter = pathFilter('/en/blog/my-article/');
    const conditions = filter.where!._or!;

    expect(conditions).toHaveLength(4);

    expect(conditions[0]).toEqual({
      _metadata: { url: { default: { eq: '/en/blog/my-article/' }, base: undefined } },
    });
    expect(conditions[1]).toEqual({
      _metadata: { url: { default: { eq: '/en/blog/my-article' }, base: undefined } },
    });
    expect(conditions[2]).toEqual({
      _metadata: { url: { hierarchical: { eq: '/en/blog/my-article/' }, base: undefined } },
    });
    expect(conditions[3]).toEqual({
      _metadata: { url: { hierarchical: { eq: '/en/blog/my-article' }, base: undefined } },
    });
  });

  it('should include base filter when host is provided', () => {
    const filter = pathFilter('/my-article', 'https://example.com');
    const conditions = filter.where!._or!;

    expect(conditions).toHaveLength(4);

    for (const condition of conditions) {
      expect(condition._metadata!.url!.base).toEqual({ eq: 'https://example.com' });
    }
  });

  it('should handle path without trailing slash', () => {
    const filter = pathFilter('/en/blog');
    const conditions = filter.where!._or!;

    expect(conditions[0]._metadata!.url!.default).toEqual({ eq: '/en/blog/' });
    expect(conditions[1]._metadata!.url!.default).toEqual({ eq: '/en/blog' });
    expect(conditions[2]._metadata!.url!.hierarchical).toEqual({ eq: '/en/blog/' });
    expect(conditions[3]._metadata!.url!.hierarchical).toEqual({ eq: '/en/blog' });
  });

  it('should find page by simple address when hierarchical URL differs', () => {
    const filter = pathFilter('/my-article');
    const conditions = filter.where!._or!;

    const defaultPaths = conditions
      .filter((c: any) => c._metadata?.url?.default)
      .map((c: any) => c._metadata.url.default.eq);
    const hierarchicalPaths = conditions
      .filter((c: any) => c._metadata?.url?.hierarchical)
      .map((c: any) => c._metadata.url.hierarchical.eq);

    expect(defaultPaths).toContain('/my-article');
    expect(defaultPaths).toContain('/my-article/');
    expect(hierarchicalPaths).toContain('/my-article');
    expect(hierarchicalPaths).toContain('/my-article/');
  });
});
