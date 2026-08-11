'use client';
/**
 * Stride error/validation notice — the visible failure surface (ADR 0002:
 * failures are part of the demo, not console noise). Rendered by StoreProvider;
 * shown for bridge `showErrorNotice` calls AND human UI errors alike.
 */
import { AlertTriangle, X } from 'lucide-react';
import { useStore } from './StoreProvider';

export function ErrorNotice() {
  const { errorNotice, dismissError } = useStore();
  if (!errorNotice) return null;
  return (
    <div
      role='alert'
      data-testid='store-error-notice'
      className='fixed left-1/2 top-24 z-[70] w-[min(92vw,560px)] -translate-x-1/2'
    >
      <div className='card border-red-200 bg-white/95 p-5 shadow-xl'>
        <div className='flex items-start gap-4'>
          <span className='mt-0.5 rounded-full bg-red-50 p-2 text-red-600'>
            <AlertTriangle size={18} />
          </span>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              <span
                data-testid='store-error-code'
                className='rounded-md bg-red-50 px-2 py-0.5 font-mono text-xs font-semibold text-red-700'
              >
                {errorNotice.code}
              </span>
            </div>
            <p data-testid='store-error-message' className='mt-2 text-sm font-semibold'>
              {errorNotice.message}
            </p>
            <p data-testid='store-error-hint' className='mt-1 text-sm text-foreground2'>
              {errorNotice.hint}
            </p>
          </div>
          <button
            onClick={dismissError}
            title='Dismiss'
            className='rounded-lg p-1 text-foreground2 transition-colors hover:bg-gray-100 hover:text-foreground'
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
