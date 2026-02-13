import type { InferredContentReference } from '../infer.js';
import type {
  PublicImageAsset,
  PublicVideoAsset,
  PublicRawFileAsset,
} from '../model/assets.js';
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
  previewToken: string | undefined,
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
 * @param content - Your content object with __context for preview tokens
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
  property: InferredContentReference | null | undefined,
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
  fallback: string = '',
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
 * Type guard that checks if a content reference is an image asset (cmp_PublicImageAsset).
 *
 * This function provides TypeScript type narrowing, allowing safe access to image-specific
 * properties such as Renditions, AltText, Width, Height, and FocalPoint after the check.
 *
 * @param property - Content reference to check
 * @returns True if the property is an image asset, with TypeScript type narrowing applied
 *
 * @example
 * ```tsx
 * import { damAssets } from '@optimizely/cms-sdk';
 *
 * export default function MediaComponent({ content }) {
 *   const { isDamImageAsset } = damAssets(content);
 *
 *   if (isDamImageAsset(content.media)) {
 *     // TypeScript knows content.media.item is PublicImageAsset
 *     const renditions = content.media.item.Renditions;
 *     const altText = content.media.item.AltText;
 *     const width = content.media.item.Width;
 *
 *     return <img src={content.media.item.Url} alt={altText} />;
 *   }
 *   return null;
 * }
 * ```
 */
export function isDamImageAsset(
  property: InferredContentReference | null | undefined,
): property is InferredContentReference & { item: PublicImageAsset } {
  return property?.item?.__typename === 'cmp_PublicImageAsset';
}

/**
 * Type guard that checks if a content reference is a video asset (cmp_PublicVideoAsset).
 *
 * This function provides TypeScript type narrowing, allowing safe access to video-specific
 * properties such as Renditions and AltText after the check.
 *
 * @param property - Content reference to check
 * @returns True if the property is a video asset, with TypeScript type narrowing applied
 *
 * @example
 * ```tsx
 * import { damAssets } from '@optimizely/cms-sdk';
 *
 * export default function MediaComponent({ content }) {
 *   const { isDamVideoAsset } = damAssets(content);
 *
 *   if (isDamVideoAsset(content.media)) {
 *     // TypeScript knows content.media.item is PublicVideoAsset
 *     const videoUrl = content.media.item.Url;
 *     const altText = content.media.item.AltText;
 *     const renditions = content.media.item.Renditions;
 *
 *     return (
 *       <video src={videoUrl} controls>
 *         {altText && <track kind="captions" label={altText} />}
 *       </video>
 *     );
 *   }
 *   return null;
 * }
 * ```
 */
export function isDamVideoAsset(
  property: InferredContentReference | null | undefined,
): property is InferredContentReference & { item: PublicVideoAsset } {
  return property?.item?.__typename === 'cmp_PublicVideoAsset';
}

/**
 * Type guard that checks if a content reference is a raw file asset (cmp_PublicRawFileAsset).
 *
 * This function provides TypeScript type narrowing, allowing safe access to file-specific
 * properties such as Url, Title, Description, and MimeType after the check. Raw file assets
 * represent general files like PDFs, documents, or other downloadable content.
 *
 * @param property - Content reference to check
 * @returns True if the property is a raw file asset, with TypeScript type narrowing applied
 *
 * @example
 * ```tsx
 * import { damAssets } from '@optimizely/cms-sdk';
 *
 * export default function MediaComponent({ content }) {
 *   const { isDamRawFileAsset } = damAssets(content);
 *
 *   if (isDamRawFileAsset(content.media)) {
 *     // TypeScript knows content.media.item is PublicRawFileAsset
 *     const fileUrl = content.media.item.Url;
 *     const title = content.media.item.Title;
 *     const mimeType = content.media.item.MimeType;
 *
 *     return (
 *       <a href={fileUrl} download>
 *         {title || 'Download File'} ({mimeType})
 *       </a>
 *     );
 *   }
 *   return null;
 * }
 * ```
 */
export function isDamRawFileAsset(
  property: InferredContentReference | null | undefined,
): property is InferredContentReference & { item: PublicRawFileAsset } {
  return property?.item?.__typename === 'cmp_PublicRawFileAsset';
}

/**
 * Checks if a content reference is any type of DAM asset (image, video, or file).
 *
 * This is useful for validating that a content reference contains a valid DAM asset
 * before attempting to render or process it. Returns false for null, undefined, or
 * content references without a valid asset item.
 *
 * @param property - Content reference to check
 * @returns True if the property is any type of DAM asset (image, video, or file)
 *
 * @example
 * ```tsx
 * import { damAssets } from '@optimizely/cms-sdk';
 *
 * export default function MediaComponent({ content }) {
 *   const { isDamAsset, getDamAssetType } = damAssets(content);
 *
 *   if (!isDamAsset(content.media)) {
 *     return <div>No media uploaded</div>;
 *   }
 *
 *   const assetType = getDamAssetType(content.media);
 *   return <div>Valid {assetType} asset detected</div>;
 * }
 * ```
 */
export function isDamAsset(
  property: InferredContentReference | null | undefined,
): boolean {
  return (
    isDamImageAsset(property) ||
    isDamVideoAsset(property) ||
    isDamRawFileAsset(property)
  );
}

/**
 * Returns the type of a DAM asset as a string literal.
 *
 * This function is useful for implementing switch-case logic or displaying the asset type
 * to users. Returns 'unknown' for null, undefined, or unrecognized asset types.
 *
 * @param property - Content reference to check
 * @returns Asset type: 'image', 'video', 'file', or 'unknown'
 *
 * @example
 * Switch-case pattern for rendering different asset types:
 * ```tsx
 * import { damAssets } from '@optimizely/cms-sdk';
 *
 * export default function AssetRenderer({ content }) {
 *   const { getSrcset, getAlt, getDamAssetType } = damAssets(content);
 *   const assetType = getDamAssetType(content.media);
 *
 *   switch (assetType) {
 *     case 'image':
 *       return (
 *         <img
 *           src={content.media.item.Url}
 *           srcSet={getSrcset(content.media)}
 *           alt={getAlt(content.media, 'Image')}
 *         />
 *       );
 *     case 'video':
 *       return <video src={content.media.item.Url} controls />;
 *     case 'file':
 *       return (
 *         <a href={content.media.item.Url} download>
 *           {content.media.item.Title || 'Download'}
 *         </a>
 *       );
 *     default:
 *       return <p>No media available</p>;
 *   }
 * }
 * ```
 *
 * @example
 * Display asset type information:
 * ```tsx
 * import { damAssets } from '@optimizely/cms-sdk';
 *
 * export default function AssetInfo({ content }) {
 *   const { getDamAssetType } = damAssets(content);
 *   const type = getDamAssetType(content.media);
 *   return <span>Asset type: {type}</span>;
 * }
 * ```
 */
export function getDamAssetType(
  property: InferredContentReference | null | undefined,
): 'image' | 'video' | 'file' | 'unknown' {
  if (isDamImageAsset(property)) return 'image';
  if (isDamVideoAsset(property)) return 'video';
  if (isDamRawFileAsset(property)) return 'file';
  return 'unknown';
}

/**
 * Creates a helper object with utility functions for working with Digital Asset Management (DAM) assets.
 *
 * Returns helper functions for asset manipulation and type checking. The `getSrcset` function
 * returned automatically includes preview tokens from the content's __context when in edit mode.
 *
 * @param content - Content object with optional __context for preview tokens
 * @returns Object containing utility functions: getSrcset, getAlt, isDamImageAsset, isDamVideoAsset, isDamRawFileAsset, isDamAsset, getDamAssetType
 *
 * @example
 * ```tsx
 * import { damAssets } from '@optimizely/cms-sdk';
 *
 * export default function MyComponent({ content }) {
 *   const { getSrcset, getAlt, isDamImageAsset } = damAssets(content);
 *
 *   if (isDamImageAsset(content.image)) {
 *     return (
 *       <img
 *         src={content.image.item.Url}
 *         srcSet={getSrcset(content.image)}
 *         alt={getAlt(content.image, 'Hero image')}
 *       />
 *     );
 *   }
 *   return null;
 * }
 * ```
 */
export function damAssets<T extends Record<string, any>>(
  content: T & { __context?: { preview_token?: string } },
) {
  return {
    getSrcset: (property: InferredContentReference | null | undefined) =>
      getSrcset(content, property),
    getAlt,
    getDamAssetType,
    isDamImageAsset,
    isDamVideoAsset,
    isDamRawFileAsset,
    isDamAsset,
  };
}
