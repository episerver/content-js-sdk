import { InferredContentReference } from '../infer.js';
import { appendToken } from '../util/preview.js';

/**
 * The parts of a content item the preview helpers read.
 *
 * Kept out of `react/server.tsx` so that client components can use these too —
 * a form field renders on the client but still has to mark its label as
 * editable. Nothing here touches React or any server-only API.
 */
type PreviewableContent = {
  __context?: { edit: boolean; preview_token: string };
  // Callers pass whole content objects; only `__context` is read.
  [key: string]: unknown;
};

/** Get context-aware functions for preview */
export function getPreviewUtils(content: PreviewableContent) {
  return {
    /** Get the HTML data attributes required for a property */
    pa(property?: string | { key: string }) {
      if (content.__context?.edit) {
        if (typeof property === 'string') {
          return {
            'data-epi-edit': property,
          };
        } else if (property) {
          return {
            'data-epi-block-id': property.key,
          };
        }

        return {};
      } else {
        return {};
      }
    },

    /**
     * Appends preview token to a ContentReference's Image assets.
     * Adds the preview token to the main URL and all rendition URLs when in preview mode.
     *
     * @param input - ContentReference from a DAM asset
     * @returns ContentReference with preview tokens appended to all URLs, or the original if not in preview mode
     *
     * @example
     * ```tsx
     * const { src } = getPreviewUtils(content);
     *
     * <img
     *   src={src(content.image)}
     * />
     * ```
     */
    src(input: InferredContentReference | string | null | undefined): string | undefined {
      const previewToken = content.__context?.preview_token;

      // if input is an object with a URL
      if (typeof input === 'object' && input) {
        // if dam asset is selected the default URL is in input.url.default will be null
        const url = input.url?.default ?? input.item?.Url;
        if (url) {
          return appendToken(url, previewToken);
        }
      }

      // if input is a string URL
      if (typeof input === 'string') {
        return appendToken(input, previewToken);
      }

      return undefined;
    },
  };
}
