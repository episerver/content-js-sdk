const TOKEN_PARAM = 'preview_token';
const TOKEN_PATTERN = new RegExp(`${TOKEN_PARAM}=[^&\\s,]*`, 'g');

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
  return `${url}${separator}${TOKEN_PARAM}=${previewToken}`;
};

/**
 * Removes the preview tokens `appendToken` added, including inside `srcset` lists.
 * The result is for comparing URLs only, not for requesting them.
 */
export const stripToken = (value: string): string => value.replace(TOKEN_PATTERN, '');

/** Drops a trailing slash, which often differs between two URLs for the same page. */
export const normalizePathname = (pathname: string): string =>
  pathname.replace(/\/$/, '') || '/';
