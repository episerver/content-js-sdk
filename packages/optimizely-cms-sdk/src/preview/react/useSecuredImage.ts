'use client';
import { useEffect, useMemo, useState } from 'react';

/**
 * Appends the preview token to an image URL (absolute or relative).
 * @param src soruce for image
 * @param tokenKey name of the key to extract from url (default to 'preview_token')
 * @returns Name of the ContentType or Media type
 */
export function useSecuredImage(
  src: string,
  tokenKey = 'preview_token'
): string {
  const [hydrated, setHydrated] = useState(false);

  // Mark component as hydrated after mount
  useEffect(() => {
    setHydrated(true);
  }, []);

  return useMemo(() => {
    // Avoid token injection during SSR to prevent hydration mismatch
    if (!hydrated || typeof window === 'undefined') return src;

    // Get token from query string
    const token = new URLSearchParams(window.location.search).get(tokenKey);
    if (!token) return src;

    try {
      // Safely append token to absolute URL
      const url = new URL(src);
      url.searchParams.set(tokenKey, token);
      return url.toString();
    } catch {
      // Fallback for malformed or relative URLs
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}${tokenKey}=${token}`;
    }
  }, [hydrated, src, tokenKey]);
}
