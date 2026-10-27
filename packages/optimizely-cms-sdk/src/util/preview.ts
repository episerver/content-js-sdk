import type { PreviewContext } from '../infer.js';

/**
 * Appends the preview token to the given URL as a query parameter.
 * If the URL or the preview token is empty, the original URL is returned.
 *
 * @param url - The original URL.
 * @param previewToken - The preview token to append.
 * @returns The URL with the preview token appended as a query parameter.
 */
export const appendToken = (url: string, previewToken?: string): string => {
  if (!url || !previewToken || previewToken.trim() === '') return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}preview_token=${previewToken}`;
};

const TOKEN_PARAM = /([?&])preview_token=[^&#]*/;

/** Sets the preview token on a URL, replacing one it already carries. */
export const withToken = (url: string, previewToken: string): string =>
  TOKEN_PARAM.test(url) ?
    url.replace(TOKEN_PARAM, `$1preview_token=${previewToken}`)
  : appendToken(url, previewToken);

/** The token for media URLs: only set when the preview opted in with `usePreviewToken`. */
export const mediaToken = (context?: Partial<PreviewContext>): string | undefined =>
  context?.usePreviewToken ? context.preview_token : undefined;
