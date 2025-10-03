import { ShowElapsed } from '@/components/render-date';
import React from 'react';

export function generateStaticParams() {
  return [{ slug: ['en'] }];
}

export default function Page() {
  const date = new Date().toISOString();

  return (
    <div>
      This page is generated and cached: {date}. <ShowElapsed date={date} />
    </div>
  );
}
