'use client';

import { useEffect } from 'react';

export function PreviewHeightReporter() {
  useEffect(() => {
    // Preview is not iframed, so we don't need to send height messages to the parent window.
    if (window.parent === window) return;

    const postHeight = () => {
      const height = Math.ceil(document.documentElement.scrollHeight);
      window.parent.postMessage({ type: 'preview-height', height }, '*');
    };

    postHeight();

    const observer = new ResizeObserver(postHeight);
    observer.observe(document.documentElement);
    window.addEventListener('load', postHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('load', postHeight);
    };
  }, []);

  return null;
}
