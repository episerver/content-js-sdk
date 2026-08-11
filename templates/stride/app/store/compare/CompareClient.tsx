'use client';
/**
 * /store/compare?ids=a,b[,c][&riderHeightCm=] — URL-addressable 2–3 bike
 * side-by-side. Data comes from GET /api/store/compare (the compare_bikes
 * route); registers the 'compare' bridge surface for showComparison.
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Comparison, StoreError } from '../../../lib/store/engine';
import { formatUsd, storeFetch } from '../../../components/store/api';
import { ProductArt } from '../../../components/store/ProductArt';
import { useStore } from '../../../components/store/StoreProvider';
import type { Bike } from '../../../lib/store/catalog/types';
import { cn } from '../../../lib/utils';

const DELTA_LABELS: Record<string, string> = {
  priceUsd: 'Price',
  weightKg: 'Weight',
  rangeKm: 'Range',
  fit: 'Your fit',
};

const BEST_BADGES: Record<string, string> = {
  DELTA_CHEAPER: 'cheapest',
  DELTA_LIGHTER: 'lightest',
  DELTA_RANGE_LONGER: 'longest range',
  DELTA_FIT_BETTER: 'best fit',
};

export function CompareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerSurface, ackSurface, notifyError } = useStore();

  const idsParam = searchParams.get('ids') ?? '';
  const heightParam = searchParams.get('riderHeightCm') ?? '';
  const queryKey = `${idsParam}|${heightParam}`;

  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState<StoreError | null>(null);
  const [loading, setLoading] = useState(false);
  const deliveredKeyRef = useRef<string | null>(null);

  const comparisonKey = (c: Comparison) =>
    `${c.products.map(p => p.id).join(',')}|${c.riderHeightCm ?? ''}`;

  useEffect(
    () =>
      registerSurface('compare', payload => {
        const delivered = payload as Comparison;
        deliveredKeyRef.current = comparisonKey(delivered);
        setComparison(delivered);
        setError(null);
        setLoading(false);
      }),
    [registerSurface],
  );

  useEffect(() => {
    if (comparison) ackSurface('compare');
  }, [comparison, ackSurface]);

  useEffect(() => {
    if (!idsParam) {
      setComparison(null);
      setLoading(false);
      return;
    }
    if (deliveredKeyRef.current === queryKey) return;
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ ids: idsParam });
    if (heightParam) params.set('riderHeightCm', heightParam);
    void storeFetch<Comparison>(`/api/store/compare?${params.toString()}`).then(res => {
      if (cancelled) return;
      if (res.ok) {
        deliveredKeyRef.current = comparisonKey(res.data);
        setComparison(res.data);
        setError(null);
      } else {
        setError(res.error);
        notifyError(res.error);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [idsParam, heightParam, queryKey, notifyError]);

  const setHeight = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('riderHeightCm', value);
    else params.delete('riderHeightCm');
    router.replace(`/store/compare?${params.toString()}`, { scroll: false });
  };

  const bikes = useMemo(() => (comparison?.products ?? []) as Bike[], [comparison]);

  return (
    <div data-testid='store-compare'>
      <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-4xl font-bold tracking-tight'>Compare bikes</h1>
          <p className='mt-3 text-foreground2'>
            Two or three bikes, side by side — price, weight, range, and your fit.
          </p>
        </div>
        <label className='flex flex-col gap-1 text-xs font-semibold text-foreground2'>
          Your height (cm)
          <input
            type='number'
            data-testid='compare-height'
            min={0}
            defaultValue={heightParam}
            key={heightParam}
            onBlur={e => setHeight(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') setHeight((e.target as HTMLInputElement).value);
            }}
            placeholder='e.g. 178'
            className='w-32 rounded-xl border border-foreground/10 bg-white px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-key1'
          />
        </label>
      </div>

      {!idsParam ?
        <EmptyCompare />
      : loading && !comparison ?
        <div className='py-24 text-center text-sm text-foreground2'>Comparing…</div>
      : error ?
        <div className='card bg-white/80 py-16 text-center' data-testid='compare-error'>
          <p className='font-mono text-xs font-semibold text-red-600'>{error.code}</p>
          <p className='mt-2 font-semibold'>{error.message}</p>
          <p className='mt-1 text-sm text-foreground2'>{error.hint}</p>
        </div>
      : comparison ?
        <div className='card overflow-x-auto bg-white/80'>
          <table className='w-full min-w-[640px] text-sm' data-testid='compare-table'>
            <thead>
              <tr>
                <th className='w-40 px-5 py-4' />
                {bikes.map(bike => (
                  <th key={bike.id} className='px-5 py-4 text-left align-top'>
                    <Link href={`/store/products/${bike.id}`} className='group block'>
                      <ProductArt product={bike} className='h-28 w-full rounded-xl' iconSize={44} />
                      <p className='mt-3 text-xs font-semibold uppercase tracking-wider text-key1'>
                        {bike.discipline}
                      </p>
                      <p className='font-bold group-hover:text-key1'>{bike.name}</p>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.deltas.map(delta => (
                <tr key={delta.field} className='border-t border-foreground/5'>
                  <td className='px-5 py-4 text-xs font-semibold uppercase tracking-wider text-foreground2'>
                    {DELTA_LABELS[delta.field] ?? delta.field}
                  </td>
                  {bikes.map(bike => {
                    const value = delta.values[bike.id];
                    const isBest = delta.bestId === bike.id;
                    return (
                      <td
                        key={bike.id}
                        data-testid={`compare-${delta.field}-${bike.id}`}
                        className={cn('px-5 py-4 align-top', isBest && 'font-bold')}
                      >
                        <span className='tabular-nums'>{formatDeltaValue(delta.field, value)}</span>
                        {isBest && delta.reasonCode && (
                          <span className='ml-2 inline-flex items-center gap-1 rounded-full bg-key1/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-key1'>
                            <Check size={10} />
                            {BEST_BADGES[delta.reasonCode] ?? delta.reasonCode}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className='border-t border-foreground/5'>
                <td className='px-5 py-4 text-xs font-semibold uppercase tracking-wider text-foreground2'>
                  Terrain
                </td>
                {bikes.map(bike => (
                  <td key={bike.id} className='px-5 py-4 capitalize text-foreground2'>
                    {bike.terrains.join(', ')}
                  </td>
                ))}
              </tr>
              <tr className='border-t border-foreground/5'>
                <td className='px-5 py-4' />
                {bikes.map(bike => (
                  <td key={bike.id} className='px-5 py-4'>
                    <Link
                      href={`/store/products/${bike.id}`}
                      className='inline-block rounded-xl bg-key1 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90'
                    >
                      View bike
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      : <EmptyCompare />}
    </div>
  );
}

function formatDeltaValue(field: string, value: number | string | null): string {
  if (value === null || value === undefined) return '—';
  if (field === 'priceUsd') return formatUsd(value as number);
  if (field === 'weightKg') return `${value} kg`;
  if (field === 'rangeKm') return `${value} km`;
  if (field === 'fit') return `size ${value}`;
  return String(value);
}

function EmptyCompare() {
  return (
    <div className='card bg-white/80 py-20 text-center' data-testid='compare-empty'>
      <p className='text-lg font-semibold'>Nothing to compare yet</p>
      <p className='mt-2 text-sm text-foreground2'>
        Pick two or three bikes in the catalog and hit Compare.
      </p>
      <Link
        href='/store?category=bike'
        className='mt-5 inline-block rounded-xl bg-key1 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90'
      >
        Browse bikes
      </Link>
    </div>
  );
}
