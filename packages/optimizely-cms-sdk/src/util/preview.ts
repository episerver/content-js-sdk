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
