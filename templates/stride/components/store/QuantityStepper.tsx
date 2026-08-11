'use client';
import { Minus, Plus } from 'lucide-react';

export function QuantityStepper({
  quantity,
  onChange,
  disabled,
  max = 9,
}: {
  quantity: number;
  onChange(next: number): void;
  disabled?: boolean;
  max?: number;
}) {
  return (
    <div className='inline-flex items-center gap-1 rounded-xl border border-foreground/10 bg-white p-0.5'>
      <button
        title='Decrease quantity'
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className='rounded-lg p-1.5 text-foreground2 transition-colors enabled:hover:bg-gray-100 enabled:hover:text-foreground disabled:opacity-30'
      >
        <Minus size={14} />
      </button>
      <span className='min-w-6 text-center text-sm font-semibold tabular-nums'>{quantity}</span>
      <button
        title='Increase quantity'
        disabled={disabled || quantity >= max}
        onClick={() => onChange(quantity + 1)}
        className='rounded-lg p-1.5 text-foreground2 transition-colors enabled:hover:bg-gray-100 enabled:hover:text-foreground disabled:opacity-30'
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
