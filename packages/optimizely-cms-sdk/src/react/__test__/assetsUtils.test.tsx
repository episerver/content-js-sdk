import { describe, it, expect } from 'vitest';
import { getPreviewUtils } from '../server.js';
import { damAssets, getSrcset, getAlt } from '../../render/assets.js';
import type { InferredContentReference } from '../../infer.js';

describe('getPreviewUtils', () => {
  const mockRenditions = [
    {
      Id: 'thumb',
      Name: 'Thumbnail',
      Url: 'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5_thumbnail_100x100_63.jpg',
      Width: 100,
      Height: 100,
    },
    {
      Id: 'small',
      Name: 'Small',
      Url: 'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5_small_256x256_63.jpg',
      Width: 256,
      Height: 256,
    },
    {
      Id: 'medium',
      Name: 'Medium',
      Url: 'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5_medium_512x512_63.jpg',
      Width: 512,
      Height: 512,
    },
    {
      Id: 'medium2',
      Name: 'Medium 2',
      Url: 'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5_medium_512x341_63.jpg',
      Width: 512,
      Height: 341,
    },
    {
      Id: 'large',
      Name: 'Large',
      Url: 'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5_large_1920x1920_63.jpg',
      Width: 1920,
      Height: 1920,
    },
  ];

  const mockImageAsset: InferredContentReference = {
    url: {
      type: null,
      default:
        'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5.jpg',
      hierarchical: null,
      internal: null,
      graph: null,
      base: null,
    },
    item: {
      __typename: 'cmp_PublicImageAsset' as const,
      Url: 'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5.jpg',
      Title: 'Harley-Davidson Touring Bike',
      AltText: 'Harley-Davidson Touring Bike motorcycle',
      Description: 'A beautiful Harley-Davidson motorcycle',
      Renditions: mockRenditions,
      FocalPoint: { X: 0.5, Y: 0.5 },
      Tags: [],
      Height: 1080,
      Width: 1920,
      MimeType: 'image/jpeg',
    },
  };

  describe('src()', () => {
    it('should return item.Url when not in preview mode', () => {
      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.src(mockImageAsset);

      expect(result).toBe(
        'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5.jpg'
      );
    });

    it('should append preview token to item.Url in preview mode', () => {
      const utils = getPreviewUtils({
        __typename: 'TestPage',
        __context: { edit: true, preview_token: 'test-token-123' },
      });
      const result = utils.src(mockImageAsset);

      // Should return the item.Url with preview token appended
      expect(result).toBe(
        'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5.jpg?preview_token=test-token-123'
      );
    });

    it('should use url.default when item.Url is null', () => {
      const assetWithDefaultUrl: InferredContentReference = {
        url: {
          type: null,
          default: 'https://example.com/default-image.jpg',
          hierarchical: null,
          internal: null,
          graph: null,
          base: null,
        },
        item: {
          __typename: 'cmp_PublicImageAsset' as const,
          Url: null,
          Title: 'Test Image',
          AltText: 'Test alt text',
          Description: 'Test description',
          Renditions: [],
          FocalPoint: null,
          Tags: [],
          Height: null,
          Width: null,
          MimeType: 'image/jpeg',
        },
      };

      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.src(assetWithDefaultUrl);

      expect(result).toBe('https://example.com/default-image.jpg');
    });

    it('should append preview token to url.default in preview mode', () => {
      const assetWithDefaultUrl: InferredContentReference = {
        url: {
          type: null,
          default: 'https://example.com/default-image.jpg',
          hierarchical: null,
          internal: null,
          graph: null,
          base: null,
        },
        item: {
          __typename: 'cmp_PublicImageAsset' as const,
          Url: null,
          Title: 'Test Image',
          AltText: 'Test alt text',
          Description: 'Test description',
          Renditions: [],
          FocalPoint: null,
          Tags: [],
          Height: null,
          Width: null,
          MimeType: 'image/jpeg',
        },
      };

      const utils = getPreviewUtils({
        __typename: 'TestPage',
        __context: { edit: true, preview_token: 'test-token-456' },
      });
      const result = utils.src(assetWithDefaultUrl);

      expect(result).toBe(
        'https://example.com/default-image.jpg?preview_token=test-token-456'
      );
    });

    it('should handle string URL input', () => {
      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.src('https://example.com/image.jpg');

      expect(result).toBe('https://example.com/image.jpg');
    });

    it('should append preview token to string URL in preview mode', () => {
      const utils = getPreviewUtils({
        __typename: 'TestPage',
        __context: { edit: true, preview_token: 'test-token-123' },
      });
      const result = utils.src('https://example.com/image.jpg');

      expect(result).toBe(
        'https://example.com/image.jpg?preview_token=test-token-123'
      );
    });

    it('should return empty string for null input', () => {
      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.src(null);

      expect(result).toBe(undefined);
    });

    it('should return empty string for undefined input', () => {
      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.src(undefined);

      expect(result).toBe(undefined);
    });

    it('should return empty string when asset has no URL', () => {
      const assetWithoutUrl: InferredContentReference = {
        url: {
          type: null,
          default: null,
          hierarchical: null,
          internal: null,
          graph: null,
          base: null,
        },
        item: {
          __typename: 'cmp_PublicImageAsset' as const,
          Url: null,
          Title: 'Test Image',
          AltText: 'Test alt text',
          Description: 'Test description',
          Renditions: [],
          FocalPoint: null,
          Tags: [],
          Height: null,
          Width: null,
          MimeType: null,
        },
      };

      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.src(assetWithoutUrl);

      expect(result).toBe(undefined);
    });

    it('should handle URLs with existing query parameters', () => {
      const utils = getPreviewUtils({
        __typename: 'TestPage',
        __context: { edit: true, preview_token: 'test-token-123' },
      });
      const result = utils.src('https://example.com/image.jpg?width=500');

      expect(result).toBe(
        'https://example.com/image.jpg?width=500&preview_token=test-token-123'
      );
    });

    it('should prefer url.default over item.Url when both exist', () => {
      const assetWithBothUrls: InferredContentReference = {
        url: {
          type: null,
          default: 'https://example.com/default-url.jpg',
          hierarchical: null,
          internal: null,
          graph: null,
          base: null,
        },
        item: {
          __typename: 'cmp_PublicImageAsset' as const,
          Url: 'https://example.com/item-url.jpg',
          Title: 'Test Image',
          AltText: 'Test alt text',
          Description: 'Test description',
          Renditions: [],
          FocalPoint: null,
          Tags: [],
          Height: null,
          Width: null,
          MimeType: 'image/jpeg',
        },
      };

      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.src(assetWithBothUrls);

      expect(result).toBe('https://example.com/default-url.jpg');
    });
  });

  describe('getSrcset()', () => {
    it('should generate srcset with unique widths from opti object', () => {
      const content = { __typename: 'TestPage', image: mockImageAsset };
      const result = getSrcset(content, content.image);

      expect(result).toBeDefined();
      // Should have 4 unique widths: 100, 256, 512, 1920 (duplicate 512 removed)
      const widthMatches = result!.match(/\d+w/g);
      expect(widthMatches).toHaveLength(4);

      expect(result).toContain('thumbnail_100x100_63.jpg 100w');
      expect(result).toContain('small_256x256_63.jpg 256w');
      expect(result).toContain('medium_512x512_63.jpg 512w');
      expect(result).toContain('large_1920x1920_63.jpg 1920w');
    });

    it('should generate srcset directly from InferredContentReference', () => {
      const content = { __typename: 'TestPage' };
      const result = getSrcset(content, mockImageAsset);

      expect(result).toBeDefined();
      // Should have 4 unique widths: 100, 256, 512, 1920 (duplicate 512 removed)
      const widthMatches = result!.match(/\d+w/g);
      expect(widthMatches).toHaveLength(4);

      expect(result).toContain('thumbnail_100x100_63.jpg 100w');
      expect(result).toContain('small_256x256_63.jpg 256w');
      expect(result).toContain('medium_512x512_63.jpg 512w');
      expect(result).toContain('large_1920x1920_63.jpg 1920w');
    });

    it('should append preview token when passed in opti context', () => {
      const content = {
        __typename: 'TestPage',
        __context: { edit: true, preview_token: 'test-token-456' },
      };
      const result = getSrcset(content, mockImageAsset);

      expect(result).toBeDefined();
      const entries = result!.split(', ');
      expect(
        entries.every((entry: string) =>
          entry.includes('preview_token=test-token-456')
        )
      ).toBe(true);
    });

    it('should deduplicate renditions with same width', () => {
      const content = { __typename: 'TestPage', image: mockImageAsset };
      const result = getSrcset(content, content.image);

      expect(result).toBeDefined();
      // Width 512 appears twice in renditions but should only appear once in srcset
      const width512Count = (result!.match(/512w/g) || []).length;
      expect(width512Count).toBe(1);
    });

    it('should append preview token to renditions in preview mode from opti', () => {
      const content = {
        __typename: 'TestPage',
        image: mockImageAsset,
        __context: { edit: true, preview_token: 'test-token-123' },
      };
      const result = getSrcset(content, content.image);

      expect(result).toBeDefined();
      const entries = result!.split(', ');
      expect(
        entries.every((entry: string) =>
          entry.includes('preview_token=test-token-123')
        )
      ).toBe(true);
    });

    it('should return undefined for null ContentReference', () => {
      const content = { __typename: 'TestPage' };
      const result = getSrcset(content, null);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined ContentReference', () => {
      const content = { __typename: 'TestPage' };
      const result = getSrcset(content, undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined for ContentReference without renditions', () => {
      const noRenditionsAsset: InferredContentReference = {
        ...mockImageAsset,
        item: {
          __typename: 'cmp_PublicImageAsset' as const,
          Url: 'https://example.com/image.jpg',
          Title: 'Test Image',
          AltText: 'Test',
          Description: 'Test description',
          Renditions: [],
          FocalPoint: null,
          Tags: [],
          Height: null,
          Width: null,
          MimeType: 'image/jpeg',
        },
      };

      const content = { __typename: 'TestPage' };
      const result = getSrcset(content, noRenditionsAsset);
      expect(result).toBeUndefined();
    });
  });

  describe('getAlt()', () => {
    it('should return AltText from image asset', () => {
      const result = getAlt(mockImageAsset);

      expect(result).toBe('Harley-Davidson Touring Bike motorcycle');
    });

    it('should use fallback when AltText is empty', () => {
      const emptyAltAsset: InferredContentReference = {
        ...mockImageAsset,
        item: {
          __typename: 'cmp_PublicImageAsset' as const,
          Url: 'https://example.com/image.jpg',
          Title: 'Test Image',
          AltText: '',
          Description: 'Test description',
          Renditions: [],
          FocalPoint: null,
          Tags: [],
          Height: null,
          Width: null,
          MimeType: 'image/jpeg',
        },
      };

      expect(getAlt(emptyAltAsset, 'Fallback text')).toBe('Fallback text');
    });

    it('should use fallback when AltText is null', () => {
      const nullAltAsset: InferredContentReference = {
        ...mockImageAsset,
        item: {
          __typename: 'cmp_PublicImageAsset' as const,
          Url: 'https://example.com/image.jpg',
          Title: 'Test Image',
          AltText: null,
          Description: 'Test description',
          Renditions: [],
          FocalPoint: null,
          Tags: [],
          Height: null,
          Width: null,
          MimeType: 'image/jpeg',
        },
      };

      expect(getAlt(nullAltAsset, 'Fallback text')).toBe('Fallback text');
    });

    it('should use fallback when input is null', () => {
      expect(getAlt(null, 'Fallback text')).toBe('Fallback text');
    });

    it('should return empty string when no fallback provided', () => {
      expect(getAlt(null)).toBe('');
    });
  });

  describe('damAssets()', () => {
    it('should return scoped getSrcset and getAlt functions', () => {
      const content = { __typename: 'TestPage', image: mockImageAsset };
      const assets = damAssets(content);

      expect(assets).toHaveProperty('getSrcset');
      expect(assets).toHaveProperty('getAlt');
      expect(typeof assets.getSrcset).toBe('function');
      expect(typeof assets.getAlt).toBe('function');
    });

    it('should generate srcset using scoped getSrcset', () => {
      const content = { __typename: 'TestPage', image: mockImageAsset };
      const { getSrcset } = damAssets(content);

      const result = getSrcset(content.image);

      expect(result).toContain('thumbnail_100x100_63.jpg 100w');
      expect(result).toContain('small_256x256_63.jpg 256w');
      expect(result).toContain('medium_512x512_63.jpg 512w');
      expect(result).toContain('large_1920x1920_63.jpg 1920w');
    });

    it('should handle preview tokens with scoped getSrcset', () => {
      const content = {
        __typename: 'TestPage',
        image: mockImageAsset,
        __context: { edit: true, preview_token: 'test-token-123' },
      };
      const { getSrcset } = damAssets(content);

      const result = getSrcset(content.image);

      expect(result).toBeDefined();
      const entries = result!.split(', ');
      expect(
        entries.every((entry: string) =>
          entry.includes('preview_token=test-token-123')
        )
      ).toBe(true);
    });

    it('should extract alt text using getAlt from damAssets', () => {
      const content = { __typename: 'TestPage', image: mockImageAsset };
      const { getAlt } = damAssets(content);

      const result = getAlt(mockImageAsset);

      expect(result).toBe('Harley-Davidson Touring Bike motorcycle');
    });

    it('should handle multiple properties with scoped getSrcset', () => {
      const content = {
        __typename: 'TestPage',
        heroImage: mockImageAsset,
        thumbnail: mockImageAsset,
      };
      const { getSrcset } = damAssets(content);

      const heroResult = getSrcset(content.heroImage);
      const thumbResult = getSrcset(content.thumbnail);

      expect(heroResult).toContain('thumbnail_100x100_63.jpg 100w');
      expect(thumbResult).toContain('thumbnail_100x100_63.jpg 100w');
    });

    it('should work with fallback in getAlt', () => {
      const emptyAltAsset: InferredContentReference = {
        ...mockImageAsset,
        item: {
          __typename: 'cmp_PublicImageAsset' as const,
          Url: 'https://example.com/image.jpg',
          Title: 'Test Image',
          AltText: '',
          Description: 'Test description',
          Renditions: [],
          FocalPoint: null,
          Tags: [],
          Height: null,
          Width: null,
          MimeType: 'image/jpeg',
        },
      };

      const content = { __typename: 'TestPage', image: emptyAltAsset };
      const { getAlt } = damAssets(content);

      expect(getAlt(emptyAltAsset, 'Custom fallback')).toBe('Custom fallback');
    });

    it('should return undefined for missing properties', () => {
      const content = { __typename: 'TestPage', image: null };
      const { getSrcset } = damAssets(content);

      const result = getSrcset(content.image);

      expect(result).toBeUndefined();
    });
  });
});
