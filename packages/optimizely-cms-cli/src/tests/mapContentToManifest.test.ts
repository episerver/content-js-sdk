import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

    const contentTypes = [
      HeroComponentType,
      duplicateHero,
      BannerComponentType,
    ];

    const result = mapContentToManifest(contentTypes);

    // Should have 2 content types (HeroComponent kept first, BannerComponent)
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('HeroComponent');
    expect(result[0].displayName).toBe('Hero Component'); // First occurrence kept
    expect(result[1].key).toBe('BannerComponent');

    // Should warn about duplicates
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Duplicate content type keys found: HeroComponent',
      ),
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

    const contentTypes = [
      HeroComponentType,
      BannerComponentType,
      duplicate1,
      duplicateBanner,
      duplicate2,
    ];

    const result = mapContentToManifest(contentTypes);

    // Should have 2 unique content types
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('HeroComponent');
    expect(result[0].displayName).toBe('Hero Component'); // First occurrence
    expect(result[1].key).toBe('BannerComponent');
    expect(result[1].displayName).toBe('Banner Component'); // First occurrence

    // Should warn about both duplicate keys
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate content type keys found:'),
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /HeroComponent.*BannerComponent|BannerComponent.*HeroComponent/,
      ),
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

  it('should handle single content type without duplicates', () => {
    const contentTypes = [HeroComponentType];

    const result = mapContentToManifest(contentTypes);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('HeroComponent');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should handle single content type with duplicate', () => {
    const duplicate: AnyContentType = {
      ...HeroComponentType,
      displayName: 'Hero Duplicate',
    };

    const contentTypes = [HeroComponentType, duplicate];

    const result = mapContentToManifest(contentTypes);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('HeroComponent');
    expect(result[0].displayName).toBe('Hero Component'); // First kept
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Duplicate content type keys found: HeroComponent',
      ),
    );
  });

  it('should transform properties correctly after deduplication', () => {
    const contentTypes = [HeroComponentType];

    const result = mapContentToManifest(contentTypes);

    expect(result[0]).toHaveProperty('key', 'HeroComponent');
    expect(result[0]).toHaveProperty('displayName', 'Hero Component');
    expect(result[0]).toHaveProperty('baseType', '_component');
    expect(result[0]).toHaveProperty('properties');
    expect(result[0].properties).toBeDefined();
  });

  it('should deduplicate before validating allowed keys', () => {
    // Create content types where one references another
    const pageType: AnyContentType = {
      key: 'PageType',
      displayName: 'Page Type',
      baseType: '_page',
      properties: {
        components: {
          type: 'contentReference',
          allowedTypes: [HeroComponentType],
        },
      },
    };

    const duplicateHero: AnyContentType = {
      ...HeroComponentType,
      displayName: 'Hero Duplicate',
    };

    const contentTypes = [pageType, HeroComponentType, duplicateHero];

    const result = mapContentToManifest(contentTypes);

    // Should have 2 unique types
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('PageType');
    expect(result[1].key).toBe('HeroComponent');

    // Should warn about duplicate
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Duplicate content type keys found: HeroComponent',
      ),
    );
  });
});
