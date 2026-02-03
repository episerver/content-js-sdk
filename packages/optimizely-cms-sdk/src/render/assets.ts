import type { InferredContentReference } from '../infer.js';
import { appendToken } from '../util/preview.js';

/**
 * Appends a preview token to a ContentReference's rendition URLs.
 * Creates a new object with modified renditions to avoid mutation.
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
 * - Returns undefined if there's no image or no renditions (attribute won't be rendered)
 *
 * @param opti - Your content object with __context for preview tokens
 * @param property - The image reference from your content (e.g., content.image)
 * @returns A srcset string like "url1 100w, url2 500w" or undefined if no renditions
 *
 * @example
 * ```tsx
 * import { damAssets } from '@optimizely/cms-sdk';
 *
 * export default function MyComponent({ content }) {
 *   const { getSrcset } = damAssets(content);
 *
 *   return (
 *     <img
 *       src={content.image?.item?.Url}
 *       srcSet={getSrcset(content.image)}
 *       sizes="(max-width: 768px) 100vw, 50vw"
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * Works with any image property:
 * ```tsx
 * const { getSrcset, getAlt } = damAssets(content);
 * <img srcSet={getSrcset(content.heroImage)} alt="Hero" />
 * ```
 */
export function getSrcset<T extends Record<string, any>>(
  content: T & { __context?: { preview_token?: string } },
  property: InferredContentReference | null | undefined
): string | undefined {
  const input = property;
  const previewToken = content?.__context?.preview_token;

  // Apply preview token to renditions if provided
  const processedInput = previewToken
    ? appendPreviewTokenToRenditions(input, previewToken)
    : input;

  if (!processedInput?.item || !('Renditions' in processedInput.item))
    return undefined;

  const renditions = processedInput.item.Renditions;
  if (!renditions || renditions.length === 0) return undefined;

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

  return srcsetEntries.length > 0 ? srcsetEntries.join(', ') : undefined;
}

/**
 * Gets the alt text for an image or video.
 *
 * It checks:
 * 1. Uses the AltText from the asset if it exists
 * 2. Falls back to your custom text if AltText is null/undefined
 * 3. Returns empty string if no alt text or fallback is available
 *
 * Note: By default, this returns an empty string when no alt text is available, which marks
 * the image as decorative. To avoid accidentally creating inaccessible content, always provide
 * a fallback or ensure your assets have AltText set in the CMS.
 *
 * @param input - Your image or video reference
 * @param fallback - Text to use if there's no AltText (defaults to empty string)
 * @returns The alt text to use
 *
 * @example
 * With a AltText present in the asset:
 * ```tsx
 * const { getAlt } = damAssets(content);
 * <img alt={getAlt(content.image)} />
 * ```
 *
 * @example
 * Using a custom fallback:
 * ```tsx
 * const { getAlt } = damAssets(content);
 * <img alt={getAlt(content.image, 'Hero Image')} />
 * ```
 *
 * @example
 * Explicitly marking an image as decorative:
 * ```tsx
 * const { getAlt } = damAssets(content);
 * <img alt={getAlt(content.icon)} /> // Will be alt="" if no AltText exists
 * ```
 */
export function getAlt(
  input: InferredContentReference | null | undefined,
  fallback: string = ''
): string {
  if (!input) return fallback;

  if (input.item && 'AltText' in input.item) {
    const rawAlt = input.item.AltText;
    // Empty strings also trigger fallback
    return rawAlt || fallback;
  }

  return fallback;
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
 * export default function MyComponent({ content }) {
 *   const { getSrcset, getAlt } = damAssets(content);
 *
 *   return (
 *     <img
 *       src={content.image?.item?.Url}
 *       srcSet={getSrcset(content.image)}
 *       sizes="(max-width: 768px) 100vw, 50vw"
 *       alt={getAlt(content.image, 'Hero image')}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * Works great with multiple images:
 * ```tsx
 * const { getSrcset, getAlt } = damAssets(content);
 *
 * <img srcSet={getSrcset(content.heroImage)} alt={getAlt(content.heroImage)} />
 * <img srcSet={getSrcset(content.thumbnail)} alt={getAlt(content.thumbnail, 'Thumbnail')} />
 * ```
 */
export function damAssets<T extends Record<string, any>>(
  content: T & { __context?: { preview_token?: string } }
) {
  return {
    getSrcset: (property: InferredContentReference | null | undefined) =>
      getSrcset(content, property),
    getAlt,
  };
}
