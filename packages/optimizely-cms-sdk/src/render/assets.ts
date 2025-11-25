import type { InferredContentReference } from '../infer.js';
import { appendToken } from '../util/preview.js';

/**
 * Appends a preview token to a ContentReference's rendition URLs.
 * Creates a new object with modified renditions to avoid mutation.
 * Internal function - not exported.
 *
 * @param input - ContentReference from a DAM asset
 * @param previewToken - The preview token to append to rendition URLs
 * @returns New ContentReference with preview tokens appended to rendition URLs
 */
function appendPreviewTokenToRenditions(
  input: InferredContentReference | null | undefined,
  previewToken: string | undefined
): InferredContentReference | null | undefined {
  if (!input || !previewToken) return input;

  // Create a shallow copy of the input
  const result = { ...input };

  // Append preview token to all rendition URLs if they exist
  if (result.item && 'Renditions' in result.item && result.item.Renditions) {
    result.item = {
      ...result.item,
      Renditions: result.item.Renditions.map((r) => ({
        ...r,
        Url: r.Url ? appendToken(r.Url, previewToken) : r.Url,
      })),
    };
  }

  return result;
}

/**
 * Creates a responsive srcset string from your image renditions.
 *
 * This handles all the messy details:
 * - Removes duplicate widths if you have multiple renditions at the same size
 * - Adds preview tokens automatically when in edit mode
 * - Returns an empty string if there's no image or no renditions
 *
 * @param opti - Your content object with __context for preview tokens
 * @param property - The image reference from your content (e.g., opti.image)
 * @returns A srcset string like "url1 100w, url2 500w" or empty string
 *
 * @example
 * ```tsx
 * import { damAssets } from '@optimizely/cms-sdk';
 *
 * export default function MyComponent({ opti }) {
 *   const { getSrcset } = damAssets(opti);
 *
 *   return (
 *     <img
 *       src={opti.image?.item?.Url}
 *       srcSet={getSrcset(opti.image)}
 *       sizes="(max-width: 768px) 100vw, 50vw"
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * Works with any image property:
 * ```tsx
 * const { getSrcset, getAlt } = damAssets(opti);
 * <img srcSet={getSrcset(opti.heroImage)} alt="Hero" />
 * ```
 */
export function getSrcset<T extends Record<string, any>>(
  opti: T & { __context?: { preview_token?: string } },
  property: InferredContentReference | null | undefined
): string {
  const input = property;
  const previewToken = opti?.__context?.preview_token;

  // Apply preview token to renditions if provided
  const processedInput = previewToken
    ? appendPreviewTokenToRenditions(input, previewToken)
    : input;

  if (!processedInput?.item || !('Renditions' in processedInput.item))
    return '';

  const renditions = processedInput.item.Renditions;
  if (!renditions || renditions.length === 0) return '';

  // Track seen widths to avoid duplicate width descriptors
  const seenWidths = new Set<number>();

  const srcsetEntries = renditions
    .filter((r) => {
      if (!r.Url || !r.Width) return false;
      // Skip if we've already seen this width
      if (seenWidths.has(r.Width)) return false;
      seenWidths.add(r.Width);
      return true;
    })
    .map((r) => `${r.Url!} ${r.Width}w`);

  return srcsetEntries.join(', ');
}

/**
 * Gets the alt text for an image or video.
 *
 * It checks in this order:
 * 1. Uses the AltText from the asset if it exists
 * 2. Falls back to your custom text if AltText is empty
 * 3. Returns empty string if nothing is provided
 *
 * @param input - Your image or video reference
 * @param fallback - Text to use if there's no AltText
 * @returns The alt text to use
 *
 * @example
 * With a AltText present in the asset:
 * ```tsx
 * const { getAlt } = damAssets(opti);
 * <img alt={getAlt(opti.image)} />
 * ```
 *
 * @example
 * Using the title as fallback:
 * ```tsx
 * const { getAlt } = damAssets(opti);
 * <img alt={getAlt(opti.image, 'Hero Image')} />
 * ```
 */
export function getAlt(
  input: InferredContentReference | null | undefined,
  fallback?: string
): string {
  if (!input) return fallback ?? '';

  // Check if item has AltText property (PublicImageAsset or PublicVideoAsset)
  if (input.item && 'AltText' in input.item) {
    const altText = input.item.AltText ?? '';
    return altText || (fallback ?? '');
  }

  return fallback ?? '';
}

/**
 * A helper that gives you pre-configured getSrcset and getAlt functions.
 *
 * Use this when you want to avoid passing opti around everywhere.
 * The returned getSrcset already knows about your preview tokens.
 *
 * @param opti - Your content object
 * @returns Helper functions for working with your images
 *
 * @example
 * ```tsx
 * import { damAssets } from '@optimizely/cms-sdk';
 *
 * export default function MyComponent({ opti }) {
 *   const { getSrcset, getAlt } = damAssets(opti);
 *
 *   return (
 *     <img
 *       src={opti.image?.item?.Url}
 *       srcSet={getSrcset(opti.image)}
 *       sizes="(max-width: 768px) 100vw, 50vw"
 *       alt={getAlt(opti.image, 'Hero image')}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * Works great with multiple images:
 * ```tsx
 * const { getSrcset, getAlt } = damAssets(opti);
 *
 * <img srcSet={getSrcset(opti.heroImage)} alt={getAlt(opti.heroImage)} />
 * <img srcSet={getSrcset(opti.thumbnail)} alt={getAlt(opti.thumbnail, 'Thumbnail')} />
 * ```
 */
export function damAssets<T extends Record<string, any>>(
  opti: T & { __context?: { preview_token?: string } }
) {
  return {
    getSrcset: (property: InferredContentReference | null | undefined) =>
      getSrcset(opti, property),
    getAlt,
  };
}
