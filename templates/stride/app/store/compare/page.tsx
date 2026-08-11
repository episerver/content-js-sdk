import { Suspense } from 'react';
import { CompareClient } from './CompareClient';

export default function ComparePage() {
  return (
    <Suspense
      fallback={<div className='py-24 text-center text-sm text-foreground2'>Loading comparison…</div>}
    >
      <CompareClient />
    </Suspense>
  );
}
