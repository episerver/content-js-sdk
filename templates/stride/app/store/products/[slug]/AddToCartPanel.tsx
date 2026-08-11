'use client';
/**
 * Variant picker + add-to-cart. Calls POST /api/store/cart/items (the same
 * route as the add_to_cart tool) with a caller-generated Idempotency-Key,
 * then opens the cart drawer; errors render the Stride error notice.
 */
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import type { FrameSize, SizingRow } from '../../../../lib/store/catalog/types';
import type { CartMutationResult } from '../../../../lib/store/engine';
import { newIdempotencyKey, storeFetch } from '../../../../components/store/api';
import { QuantityStepper } from '../../../../components/store/QuantityStepper';
import { useStore } from '../../../../components/store/StoreProvider';
import { cn } from '../../../../lib/utils';

export function AddToCartPanel({
  productId,
  category,
  inStock,
  variants,
  sizing,
}: {
  productId: string;
  category: 'bike' | 'accessory';
  inStock: boolean;
  variants?: { frameSize: FrameSize; inStock: boolean }[];
  sizing?: SizingRow[];
}) {
  const { applyMutation, notifyError } = useStore();
  const [frameSize, setFrameSize] = useState<FrameSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  const needsSize = category === 'bike';

  const add = async () => {
    setBusy(true);
    try {
      const res = await storeFetch<CartMutationResult>('/api/store/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': newIdempotencyKey() },
        body: JSON.stringify({
          productId,
          ...(frameSize ? { frameSize } : {}),
          quantity,
        }),
      });
      if (res.ok) applyMutation(res.data);
      else notifyError(res.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='card mt-6 bg-white/80 p-5' data-testid='add-to-cart-panel'>
      {needsSize && variants && (
        <div>
          <p className='text-xs font-semibold uppercase tracking-wider text-foreground2'>
            Frame size
          </p>
          <div className='mt-2 flex flex-wrap gap-2'>
            {variants.map(v => {
              const band = sizing?.find(r => r.frameSize === v.frameSize);
              return (
                <button
                  key={v.frameSize}
                  disabled={!v.inStock}
                  onClick={() => setFrameSize(v.frameSize)}
                  data-testid={`variant-${v.frameSize}`}
                  title={
                    band ?
                      `riders ${band.riderHeightMinCm}–${band.riderHeightMaxCm} cm${v.inStock ? '' : ' — out of stock'}`
                    : undefined
                  }
                  className={cn(
                    'rounded-xl border px-4 py-2 text-sm font-semibold transition-colors',
                    frameSize === v.frameSize ?
                      'border-key1 bg-key1 text-white'
                    : v.inStock ? 'border-foreground/10 bg-white hover:border-key1/60'
                    : 'cursor-not-allowed border-foreground/5 text-foreground2/40 line-through',
                  )}
                >
                  {v.frameSize}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className='mt-5 flex flex-wrap items-center gap-4'>
        <QuantityStepper quantity={quantity} onChange={setQuantity} disabled={busy} />
        <button
          onClick={() => void add()}
          disabled={busy || !inStock || (needsSize && frameSize === null)}
          data-testid='add-to-cart'
          className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-key1 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40'
        >
          <ShoppingCart size={15} />
          {!inStock ?
            'Out of stock'
          : needsSize && frameSize === null ?
            'Pick a size'
          : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
