import { describe, it, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapContentToManifest } from '../mapper/contentToPackage.js';
import { HeroComponentType, BannerComponentType } from './fixtures.js';
import type { AnyContentType } from '../service/utils.js';

describe('mapContentToManifest', () => {
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should handle duplicate keys by keeping the first occurrence', () => {
    const duplicateHero: AnyContentType = {
      ...HeroComponentType,
      displayName: 'Hero Component Updated',
    };

    const contentTypes = [HeroComponentType, duplicateHero, BannerComponentType];

    const result = mapContentToManifest(contentTypes);

    // Should have 2 content types (HeroComponent kept first, BannerComponent)
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('HeroComponent');
    expect(result[0].displayName).toBe('Hero Component'); // First occurrence kept
    expect(result[1].key).toBe('BannerComponent');

    // Should warn about duplicates
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate content type keys found: HeroComponent'),
    );
  });

  it('should handle multiple duplicates correctly', () => {
    const duplicate1: AnyContentType = {
      ...HeroComponentType,
      displayName: 'Hero 2',
    };
    const duplicate2: AnyContentType = {
      ...HeroComponentType,
      displayName: 'Hero 3',
    };
    const duplicateBanner: AnyContentType = {
      ...BannerComponentType,
      displayName: 'Banner 2',
    };

    const contentTypes = [HeroComponentType, BannerComponentType, duplicate1, duplicateBanner, duplicate2];

    const result = mapContentToManifest(contentTypes);

    // Should have 2 unique content types
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('HeroComponent');
    expect(result[0].displayName).toBe('Hero Component'); // First occurrence
    expect(result[1].key).toBe('BannerComponent');
    expect(result[1].displayName).toBe('Banner Component'); // First occurrence

    // Should warn about both duplicate keys
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicate content type keys found:'));
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/HeroComponent.*BannerComponent|BannerComponent.*HeroComponent/),
    );
  });

  it('should not warn when there are no duplicates', () => {
    const contentTypes = [HeroComponentType, BannerComponentType];

    const result = mapContentToManifest(contentTypes);

    expect(result).toHaveLength(2);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should handle empty array', () => {
    const result = mapContentToManifest([]);

    expect(result).toEqual([]);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should preserve order for non-duplicate keys', () => {
    const contentTypes = [BannerComponentType, HeroComponentType];

    const result = mapContentToManifest(contentTypes);

    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('BannerComponent');
    expect(result[1].key).toBe('HeroComponent');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should transform properties correctly after deduplication', () => {
    const page = {
      key: 'LandingPage',
      displayName: 'Landing Page',
      baseType: '_page',
      extends: [{ key: 'SeoContract' }],
      properties: {
        hero: { type: 'contentReference', contentType: HeroComponentType },
      },
    } as unknown as AnyContentType;

    const result = mapContentToManifest([page, { ...page, displayName: 'Duplicate' }]);

    expect(result).toEqual([
      {
        key: 'LandingPage',
        displayName: 'Landing Page',
        baseType: '_page',
        mayContainTypes: ['*'],
        contracts: ['SeoContract'],
        properties: {
          hero: { type: 'contentReference', contentType: 'HeroComponent' },
        },
      },
    ]);
  });

  it('should deduplicate before validating allowed keys', () => {
    const pageType: AnyContentType = {
      key: 'PageType',
      displayName: 'Page Type',
      baseType: '_page',
      mayContainTypes: ['HeroComponent'],
    };

    const duplicateHero: AnyContentType = {
      ...HeroComponentType,
      displayName: 'Hero Duplicate',
    };

    const result = mapContentToManifest([pageType, HeroComponentType, duplicateHero]);

    expect(result.map(it => it.key)).toEqual(['PageType', 'HeroComponent']);
    expect(result[0].mayContainTypes).toEqual(['HeroComponent']);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate content type keys found: HeroComponent'),
    );
  });

  test('rejects mayContainTypes keys that are not among the pushed content types', () => {
    const pageType: AnyContentType = {
      key: 'PageType',
      displayName: 'Page Type',
      baseType: '_page',
      mayContainTypes: ['MissingComponent'],
    };

    expect(() => mapContentToManifest([pageType, HeroComponentType])).toThrow(
      'Unknown content types: MissingComponent',
    );
  });

  test('rejects an invalid content type key', () => {
    const invalid = { ...HeroComponentType, key: '1Hero' } as AnyContentType;

    expect(() => mapContentToManifest([invalid])).toThrow('Invalid content type key: "1Hero"');
  });
});
