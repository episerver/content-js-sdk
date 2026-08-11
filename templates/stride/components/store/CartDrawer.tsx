'use client';
/**
 * Immediate-feedback cart drawer (ADR 0001) — opens on mutations, shared by
 * human clicks and bridge `showCart(cart, 'drawer')` calls. Its own quantity/
 * remove controls call the same /api/store/* routes.
 */
import Link from 'next/link';
import { ShoppingCart, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { CartMutationResult } from '../../lib/store/engine';
import { formatUsd, newIdempotencyKey, storeFetch } from './api';
import { QuantityStepper } from './QuantityStepper';
import { useStore } from './StoreProvider';

export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, applyMutation, notifyError } = useStore();
  const [busy, setBusy] = useState<string | null>(null);

  if (!drawerOpen) return null;

  const mutate = async (cartItemId: string, action: 'update' | 'remove', quantity?: number) => {
    setBusy(cartItemId);
    try {
      const res =
        action === 'update' ?
          await storeFetch<CartMutationResult>(
            `/api/store/cart/items/${encodeURIComponent(cartItemId)}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Idempotency-Key': newIdempotencyKey(),
              },
              body: JSON.stringify({ quantity }),
            },
          )
        : await storeFetch<CartMutationResult>(
            `/api/store/cart/items/${encodeURIComponent(cartItemId)}`,
            { method: 'DELETE', headers: { 'Idempotency-Key': newIdempotencyKey() } },
          );
      if (res.ok) applyMutation(res.data);
      else notifyError(res.error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className='fixed inset-0 z-[60]' data-testid='cart-drawer'>
      <button
        aria-label='Close cart'
        className='absolute inset-0 bg-black/30 backdrop-blur-[2px]'
        onClick={closeDrawer}
      />
      <aside className='absolute right-0 top-0 flex h-full w-[min(92vw,420px)] flex-col bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-foreground/10 px-6 py-5'>
          <h2 className='flex items-center gap-2 text-lg font-bold'>
            <ShoppingCart size={18} className='text-key1' />
            Your cart
            {cart && cart.itemCount > 0 && (
              <span
                data-testid='cart-drawer-count'
                className='rounded-full bg-key1/10 px-2 py-0.5 text-xs font-semibold text-key1'
              >
                {cart.itemCount}
              </span>
            )}
          </h2>
          <button
            onClick={closeDrawer}
            title='Close'
            className='rounded-lg p-1.5 text-foreground2 transition-colors hover:bg-gray-100 hover:text-foreground'
          >
            <X size={18} />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-6 py-4 scrollbar-thin'>
          {!cart || cart.items.length === 0 ?
            <div className='py-16 text-center text-sm text-foreground2' data-testid='cart-drawer-empty'>
              Your cart is empty.
              <div className='mt-4'>
                <Link
                  href='/store'
                  onClick={closeDrawer}
                  className='font-semibold text-key1 hover:underline'
                >
                  Browse the store
                </Link>
              </div>
            </div>
          : <ul className='space-y-4'>
              {cart.items.map(item => (
                <li
                  key={item.cartItemId}
                  data-testid={`cart-drawer-item-${item.cartItemId}`}
                  className='card flex items-center gap-4 bg-white p-4'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold'>{item.name}</p>
                    <p className='text-xs text-foreground2'>
                      {item.frameSize ? `Size ${item.frameSize} · ` : ''}
                      {formatUsd(item.unitPriceUsd)} each
                    </p>
                    <div className='mt-2 flex items-center gap-3'>
                      <QuantityStepper
                        quantity={item.quantity}
                        disabled={busy === item.cartItemId}
                        onChange={q => void mutate(item.cartItemId, 'update', q)}
                      />
                      <button
                        title='Remove item'
                        disabled={busy === item.cartItemId}
                        onClick={() => void mutate(item.cartItemId, 'remove')}
                        className='rounded-lg p-1.5 text-foreground2 transition-colors hover:bg-red-50 hover:text-red-600'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className='text-sm font-bold tabular-nums'>{formatUsd(item.lineTotalUsd)}</p>
                </li>
              ))}
            </ul>
          }
        </div>

        {cart && cart.items.length > 0 && (
          <div className='border-t border-foreground/10 px-6 py-5'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-foreground2'>Subtotal</span>
              <span data-testid='cart-drawer-subtotal' className='text-lg font-bold tabular-nums'>
                {formatUsd(cart.subtotalUsd)}
              </span>
            </div>
            <Link
              href='/store/cart'
              onClick={closeDrawer}
              className='mt-4 block rounded-xl bg-key1 px-4 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90'
            >
              View cart
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
