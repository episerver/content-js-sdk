// This page renders the date when it was built.
import { ShowElapsed } from '@/components/render-date';
import React from 'react';

export function generateStaticParams() {
  // Only pages with static params will be pre-rendered.
  // Change this array if you want to pre-render another path
  return [
    // Will pre-render the path /en:
    { slug: ['en'] },

    // Will pre-render the path /en/menu:
    // { slug: ['en', 'menu'] },
  ];
}

export default function Page() {
  const date = new Date().toISOString();

  return (
    <div>
      This page is generated and cached: {date}. <ShowElapsed date={date} />
    </div>
  );
}
