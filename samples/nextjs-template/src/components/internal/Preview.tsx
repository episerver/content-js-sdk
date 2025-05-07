'use client';

import { useEffect } from 'react';

export default function Preview() {
  useEffect(() => {
    window.addEventListener('optimizely:cms:contentSaved', (event: any) => {
      window.location.replace(event.detail.previewUrl);
    });
  });

  return <></>;
}
