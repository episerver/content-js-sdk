import { Bike as BikeIcon, HardHat, Lightbulb, Lock } from 'lucide-react';
import type { Product } from '../../lib/store/catalog/types';
import { cn } from '../../lib/utils';

/** Deterministic product visual from imageHue (0–359) — no external images. */
export function ProductArt({
  product,
  className,
  iconSize = 64,
}: {
  product: Product;
  className?: string;
  iconSize?: number;
}) {
  const hue = product.imageHue;
  const Icon =
    product.category === 'bike' ? BikeIcon
    : product.kind === 'helmet' ? HardHat
    : product.kind === 'lock' ? Lock
    : Lightbulb;
  return (
    <div
      aria-hidden
      className={cn('relative flex items-center justify-center overflow-hidden', className)}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 72% 62%) 0%, hsl(${(hue + 40) % 360} 78% 38%) 100%)`,
      }}
    >
      <div
        className='absolute inset-0 opacity-25'
        style={{
          background: `radial-gradient(circle at 25% 20%, hsl(${(hue + 300) % 360} 90% 85%) 0%, transparent 55%)`,
        }}
      />
      <Icon
        size={iconSize}
        strokeWidth={1.25}
        className='relative text-white/85 drop-shadow-sm'
      />
      {!product.inStock && (
        <span className='absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white'>
          Out of stock
        </span>
      )}
    </div>
  );
}
