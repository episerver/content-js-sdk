'use client';

import { useEffect } from 'react';

/**
 * Listens for Optimizely CMS content saved events and redirects to the
 * preview URL with the token appended.
 */
export function PreviewComponent() {
  useEffect(() => {
    const handler = (e: Event) => {
      let finalUrl: string;
      const { previewUrl } = (e as CustomEvent).detail;

      try {
        // Handles both absolute and relative URLs
        const url = new URL(previewUrl, window.location.origin);
        finalUrl = url.toString();
      } catch {
        // Fallback for malformed or relative-only URLs
        finalUrl = previewUrl;
      }

      // reload the preview page with new tokens
      window.location.replace(finalUrl);
    };

    window.addEventListener('optimizely:cms:contentSaved', handler);
    return () =>
      window.removeEventListener('optimizely:cms:contentSaved', handler);
  }, []);

  return null;
}
