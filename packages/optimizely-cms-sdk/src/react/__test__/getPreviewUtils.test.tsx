import { describe, it, expect } from 'vitest';
import { getPreviewUtils } from '../server.js';
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
    },
  };

  describe('src()', () => {
    it('should return default URL when no rendition is specified', () => {
      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.src(mockImageAsset);

      expect(result).toBe(
        'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5.jpg'
      );
    });

    it('should return URL from specified rendition', () => {
      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.src(mockImageAsset, { renditionName: 'Large' });

      expect(result).toBe(
        'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5_large_1920x1920_63.jpg'
      );
    });

    it('should append preview token in preview mode', () => {
      const utils = getPreviewUtils({
        __typename: 'TestPage',
        __context: { edit: true, preview_token: 'test-token-123' },
      });
      const result = utils.src(mockImageAsset);

      expect(result).toBe(
        'https://assets.local-cms.com/0a2f4b27-4f15-4bb9-ba14-d69b49ae5b85/cmp_73d48db0-2abe-4a33-91f5-94d0ac5e85e5.jpg?preview_token=test-token-123'
      );
    });
  });

  describe('srcset()', () => {
    it('should generate srcset with unique widths', () => {
      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.srcset(mockImageAsset);

      // Should have 4 unique widths: 100, 256, 512, 1920 (duplicate 512 removed)
      const widthMatches = result.match(/\d+w/g);
      expect(widthMatches).toHaveLength(4);

      expect(result).toContain('thumbnail_100x100_63.jpg 100w');
      expect(result).toContain('small_256x256_63.jpg 256w');
      expect(result).toContain('medium_512x512_63.jpg 512w');
      expect(result).toContain('large_1920x1920_63.jpg 1920w');
    });

    it('should deduplicate renditions with same width', () => {
      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.srcset(mockImageAsset);

      // Width 512 appears twice in renditions but should only appear once in srcset
      const width512Count = (result.match(/512w/g) || []).length;
      expect(width512Count).toBe(1);
    });

    it('should append preview token to all URLs', () => {
      const utils = getPreviewUtils({
        __typename: 'TestPage',
        __context: { edit: true, preview_token: 'test-token-123' },
      });
      const result = utils.srcset(mockImageAsset);

      const entries = result.split(', ');
      expect(
        entries.every((entry: string) =>
          entry.includes('preview_token=test-token-123')
        )
      ).toBe(true);
    });
  });

  describe('alt()', () => {
    it('should return AltText from image asset', () => {
      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.alt(mockImageAsset);

      expect(result).toBe('Harley-Davidson Touring Bike motorcycle');
    });

    it('should return string as-is', () => {
      const utils = getPreviewUtils({ __typename: 'TestPage' });
      const result = utils.alt('Custom alt text');

      expect(result).toBe('Custom alt text');
    });
  });
});
