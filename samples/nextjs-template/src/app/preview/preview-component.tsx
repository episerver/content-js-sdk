'use client';

import { useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callback(event: any) {
  console.log('CALLBACK');
  const message = event.detail;

  const newPreviewUrl = message.previewUrl;
  console.log(newPreviewUrl);

  window.location.replace(newPreviewUrl);
}

// This is a temporal React.js Preview component. It updates the entire page when content is saved in the CMS
export function PreviewComponent() {
  useEffect(() => {
    console.log('USE EFFECT');
    window.addEventListener('optimizely:cms:contentSaved', callback);

    return () => {
      window.removeEventListener('optimizely:cms:contentSaved', callback);
    };
  });

  return <></>;
}
