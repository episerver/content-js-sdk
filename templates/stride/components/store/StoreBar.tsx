'use client';
/**
 * Store chrome bar: section nav, cart button with live count, Reset-demo
 * control, and the Clear-telemetry / Export-JSON controls (both consuming the
 * single TelemetrySink via the provider — §6).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Download, Eraser, RotateCcw, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useStore } from './StoreProvider';

const LINKS = [
  { href: '/store', label: 'Catalog' },
  { href: '/store/compare', label: 'Compare' },
  { href: '/store/cart', label: 'Cart' },
];

export function StoreBar() {
  const { cart, openDrawer, resetDemo, telemetry } = useStore();
  const pathname = usePathname();
  const [resetting, setResetting] = useState(false);
  const [cleared, setCleared] = useState(false);

  const exportTelemetry = () => {
    const json = telemetry.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stride-telemetry.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearTelemetry = () => {
    telemetry.clear();
    setCleared(true);
    window.setTimeout(() => setCleared(false), 1500);
  };

  const reset = async () => {
    setResetting(true);
    try {
      await resetDemo();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className='border-b border-foreground/10 bg-white/70 backdrop-blur'>
      <div className='container flex flex-wrap items-center justify-between gap-3 py-3'>
        <nav className='flex items-center gap-5'>
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-semibold transition-opacity',
                pathname === link.href ? 'text-key1' : 'opacity-70 hover:opacity-100',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className='flex items-center gap-2'>
          <button
            onClick={clearTelemetry}
            data-testid='clear-telemetry'
            title='Clear the local telemetry log'
            className='flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground2 transition-colors hover:bg-gray-100 hover:text-foreground'
          >
            <Eraser size={13} />
            {cleared ? 'Cleared' : 'Clear telemetry'}
          </button>
          <button
            onClick={exportTelemetry}
            data-testid='export-telemetry'
            title='Export the telemetry log as JSON'
            className='flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground2 transition-colors hover:bg-gray-100 hover:text-foreground'
          >
            <Download size={13} />
            Export JSON
          </button>
          <button
            onClick={() => void reset()}
            disabled={resetting}
            data-testid='reset-demo'
            title='Reset the demo: fresh session, empty cart'
            className='flex items-center gap-1.5 rounded-xl border border-foreground/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-100 disabled:opacity-50'
          >
            <RotateCcw size={13} className={resetting ? 'animate-spin' : undefined} />
            Reset demo
          </button>
          <button
            onClick={openDrawer}
            data-testid='open-cart-drawer'
            title='Open cart'
            className='relative flex items-center gap-1.5 rounded-xl bg-key1 px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90'
          >
            <ShoppingCart size={13} />
            Cart
            {cart && cart.itemCount > 0 && (
              <span
                data-testid='cart-count'
                className='rounded-full bg-white/25 px-1.5 py-0.5 tabular-nums'
              >
                {cart.itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
