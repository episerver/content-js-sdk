const TOKEN_PARAM = /([?&])preview_token=[^&#]*/;
const TOKEN_PATTERN = /preview_token=[^&\s,]*/g;

/**
 * Sets the preview token on the given URL as a query parameter, replacing one it
 * already carries. If the URL or the preview token is empty, the original URL is returned.
 *
 * @param url - The original URL.
 * @param previewToken - The preview token to set.
 * @returns The URL with the preview token as a query parameter.
 */
export const withPreviewToken = (url: string, previewToken?: string): string => {
  if (!url || !previewToken || previewToken.trim() === '') return url;
  if (TOKEN_PARAM.test(url)) return url.replace(TOKEN_PARAM, `$1preview_token=${previewToken}`);

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}preview_token=${previewToken}`;
};

/**
 * Removes the preview tokens `withPreviewToken` added, including inside `srcset` lists.
 * The result is for comparing URLs only, not for requesting them.
 */
export const stripToken = (value: string): string => value.replace(TOKEN_PATTERN, '');

/** Drops a trailing slash, which often differs between two URLs for the same page. */
export const normalizePathname = (pathname: string): string =>
  pathname.replace(/\/$/, '') || '/';
