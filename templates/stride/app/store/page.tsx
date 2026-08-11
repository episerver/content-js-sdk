import { Suspense } from 'react';
import { CatalogClient } from './CatalogClient';

export default function StorePage() {
  return (
    <Suspense
      fallback={<div className='py-24 text-center text-sm text-foreground2'>Loading the store…</div>}
    >
      <CatalogClient />
    </Suspense>
  );
}
