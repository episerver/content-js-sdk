'use client';
/**
 * /store/cart — the durable cart view (ADR 0001). Quantity/remove controls
 * call the same PATCH/DELETE routes as the WebMCP cart tools; registers the
 * 'cart-page' bridge surface for showCart(cart, 'page').
 */
import Link from 'next/link';
import { RotateCcw, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Cart, CartMutationResult } from '../../../lib/store/engine';
import { formatUsd, newIdempotencyKey, storeFetch } from '../../../components/store/api';
import { QuantityStepper } from '../../../components/store/QuantityStepper';
import { useStore } from '../../../components/store/StoreProvider';

export function CartClient() {
  const { registerSurface, ackSurface, setCart, notifyError, resetDemo } = useStore();
  const [cart, setLocalCart] = useState<Cart | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(
    () =>
      registerSurface('cart-page', payload => {
        setLocalCart(payload as Cart);
      }),
    [registerSurface],
  );

  useEffect(() => {
    if (cart) ackSurface('cart-page');
  }, [cart, ackSurface]);

  useEffect(() => {
    let cancelled = false;
    void storeFetch<Cart>('/api/store/cart').then(res => {
      if (!cancelled && res.ok) {
        setLocalCart(res.data);
        setCart(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [setCart]);

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
      if (res.ok) {
        setLocalCart(res.data.cart);
        setCart(res.data.cart); // keep the global count in sync, no drawer
      } else {
        notifyError(res.error);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div data-testid='store-cart-page'>
      <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='flex items-center gap-3 text-4xl font-bold tracking-tight'>
            <ShoppingCart size={30} className='text-key1' />
            Your cart
          </h1>
          {cart && (
            <p className='mt-3 text-xs text-foreground2'>
              Session <span className='font-mono'>{cart.sessionId}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => void resetDemo()}
          data-testid='cart-reset-demo'
          className='flex items-center gap-1.5 rounded-xl border border-foreground/10 px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-100'
        >
          <RotateCcw size={13} />
          Reset demo
        </button>
      </div>

      {!cart ?
        <div className='py-24 text-center text-sm text-foreground2'>Loading your cart…</div>
      : cart.items.length === 0 ?
        <div className='card bg-white/80 py-20 text-center' data-testid='cart-empty'>
          <p className='text-lg font-semibold'>Your cart is empty</p>
          <p className='mt-2 text-sm text-foreground2'>
            Find a bike that fits, then kit it out with compatible gear.
          </p>
          <Link
            href='/store'
            className='mt-5 inline-block rounded-xl bg-key1 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90'
          >
            Browse the store
          </Link>
        </div>
      : <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          <ul className='space-y-4 lg:col-span-2'>
            {cart.items.map(item => (
              <li
                key={item.cartItemId}
                data-testid={`cart-item-${item.cartItemId}`}
                className='card flex items-center gap-5 bg-white/80 p-5'
              >
                <div className='min-w-0 flex-1'>
                  <Link
                    href={`/store/products/${item.productId}`}
                    className='block truncate font-bold hover:text-key1'
                  >
                    {item.name}
                  </Link>
                  <p className='mt-0.5 text-xs text-foreground2'>
                    {item.frameSize ? `Frame size ${item.frameSize} · ` : ''}
                    {formatUsd(item.unitPriceUsd)} each ·{' '}
                    <span className='font-mono'>{item.cartItemId}</span>
                  </p>
                  <div className='mt-3 flex items-center gap-3'>
                    <QuantityStepper
                      quantity={item.quantity}
                      disabled={busy === item.cartItemId}
                      onChange={quantity => void mutate(item.cartItemId, 'update', quantity)}
                    />
                    <button
                      title='Remove item'
                      data-testid={`cart-remove-${item.cartItemId}`}
                      disabled={busy === item.cartItemId}
                      onClick={() => void mutate(item.cartItemId, 'remove')}
                      className='flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground2 transition-colors hover:bg-red-50 hover:text-red-600'
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>
                </div>
                <p className='text-base font-bold tabular-nums'>{formatUsd(item.lineTotalUsd)}</p>
              </li>
            ))}
          </ul>

          <div className='card h-fit bg-white/80 p-6'>
            <h2 className='text-lg font-bold'>Summary</h2>
            <dl className='mt-4 space-y-2 text-sm'>
              <div className='flex items-center justify-between'>
                <dt className='text-foreground2'>Items</dt>
                <dd className='font-semibold tabular-nums' data-testid='cart-item-count'>
                  {cart.itemCount}
                </dd>
              </div>
              <div className='flex items-center justify-between border-t border-foreground/10 pt-3'>
                <dt className='font-semibold'>Subtotal</dt>
                <dd className='text-xl font-bold tabular-nums' data-testid='cart-subtotal'>
                  {formatUsd(cart.subtotalUsd)}
                </dd>
              </div>
            </dl>
            <p className='mt-4 text-xs text-foreground2'>
              Checkout is out of scope for this demo — the cart is the destination.
            </p>
            <Link
              href='/store'
              className='mt-5 block rounded-xl border border-foreground/10 px-4 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-gray-100'
            >
              Continue shopping
            </Link>
          </div>
        </div>
      }
    </div>
  );
}
