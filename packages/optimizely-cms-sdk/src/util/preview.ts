/**
 * Appends the preview token to the given URL as a query parameter.
 * If the preview token is not provided, the original URL is returned.
 *
 * @param url - The original URL.
 * @param previewToken - The preview token to append.
 * @returns The URL with the preview token appended as a query parameter.
 */
export const appendToken = (url: string, previewToken?: string): string => {
  if (!previewToken || previewToken.trim() === '') return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}preview_token=${previewToken}`;
};
