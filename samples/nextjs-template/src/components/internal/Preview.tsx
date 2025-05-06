'use client';

import { useEffect } from 'react';

export default function Preview() {
  useEffect(() => {
    window.addEventListener('optimizely:cms:contentSaved', (event: any) => {
      document.body.style.backgroundColor = 'green';
      setTimeout(() => {
        window.location.replace(event.detail.previewUrl);
      }, 700);
    });
  });

  return <></>;
}
