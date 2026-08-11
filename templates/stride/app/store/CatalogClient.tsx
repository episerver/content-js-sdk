'use client';
/**
 * /store — catalog grid, search box, filter controls, sort. ALL state is
 * URL-reflected and shareable; results come from POST /api/store/search (the
 * same route the WebMCP tools call). Registers the 'search' bridge surface so
 * `showSearch` can patch this page and resolve only after the DOM applied.
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Plus, Scale, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Bike } from '../../lib/store/catalog/types';
import type { CartMutationResult, Match, SearchResult } from '../../lib/store/engine';
import { formatUsd, newIdempotencyKey, storeFetch } from '../../components/store/api';
import { ProductArt } from '../../components/store/ProductArt';
import { argsKey, paramsToArgs } from '../../components/store/searchParams';
import { useStore } from '../../components/store/StoreProvider';
import { cn } from '../../lib/utils';

export function CatalogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerSurface, ackSurface, applyMutation, notifyError } = useStore();

  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const deliveredKeyRef = useRef<string | null>(null);

  const q = searchParams.get('q') ?? '';
  const args = useMemo(
    () => paramsToArgs(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const key = argsKey(args);
  const argsRef = useRef(args);
  argsRef.current = args;

  // Bridge surface registration MUST precede the fetch effect (payloads
  // delivered before mount are flushed synchronously here).
  useEffect(
    () =>
      registerSurface('search', payload => {
        const delivered = payload as SearchResult;
        deliveredKeyRef.current = argsKey(delivered.args);
        setResult(delivered);
        setLoading(false);
      }),
    [registerSurface],
  );

  // Ack after React commits the applied result to the DOM (await-commit, §4).
  useEffect(() => {
    if (result) ackSurface('search');
  }, [result, ackSurface]);

  // URL → results. Skips the fetch when the bridge already delivered this
  // exact query's result (showSearch sets URL + payload together).
  useEffect(() => {
    if (deliveredKeyRef.current === key) return;
    let cancelled = false;
    setLoading(true);
    void storeFetch<SearchResult>('/api/store/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(argsRef.current),
    }).then(res => {
      if (cancelled) return;
      if (res.ok) {
        deliveredKeyRef.current = argsKey(res.data.args);
        setResult(res.data);
      } else {
        notifyError(res.error);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [key, notifyError]);

  const setParam = (name: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') params.delete(name);
    else params.set(name, value);
    router.replace(`/store${params.size ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const visibleMatches = useMemo(() => {
    if (!result) return [];
    if (!q) return result.matches;
    const needle = q.toLowerCase();
    return result.matches.filter(
      m =>
        m.product.name.toLowerCase().includes(needle) ||
        m.product.description.toLowerCase().includes(needle) ||
        m.product.id.includes(needle),
    );
  }, [result, q]);

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id)
      : prev.length >= 3 ? prev
      : [...prev, id],
    );
  };

  const quickAdd = async (productId: string) => {
    const res = await storeFetch<CartMutationResult>('/api/store/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': newIdempotencyKey() },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) applyMutation(res.data);
    else notifyError(res.error);
  };

  // Filters without a dedicated control still surface as removable chips so a
  // copied URL reproduces every visible state.
  const extraChips: { param: string; label: string }[] = [];
  if (args.terrain) extraChips.push({ param: 'terrain', label: `terrain: ${args.terrain}` });
  if (args.kind) extraChips.push({ param: 'kind', label: `kind: ${args.kind}` });
  if (args.minRangeKm !== undefined)
    extraChips.push({ param: 'minRange', label: `range ≥ ${args.minRangeKm} km` });
  if (args.compatibleWithProductId)
    extraChips.push({ param: 'compat', label: `fits: ${args.compatibleWithProductId}` });
  if (args.preferences?.colors?.length)
    extraChips.push({ param: 'colors', label: `colors: ${args.preferences.colors.join(', ')}` });
  if (args.preferences?.style)
    extraChips.push({ param: 'style', label: `style: ${args.preferences.style}` });

  const compareHeight = args.riderHeightCm;

  return (
    <div data-testid='store-catalog'>
      <div className='mb-8 max-w-2xl'>
        <h1 className='text-4xl font-bold tracking-tight'>The Stride Store</h1>
        <p className='mt-3 text-foreground2'>
          Bikes and gear, matched to how you ride. Filter by discipline, budget, and fit — or let
          your agent do it for you.
        </p>
      </div>

      {/* Filter controls — every control reads from and writes to the URL. */}
      <div className='card mb-8 bg-white/80 p-5' data-testid='store-filters'>
        <div className='flex flex-wrap items-end gap-4'>
          <label className='flex min-w-52 flex-1 flex-col gap-1 text-xs font-semibold text-foreground2'>
            Search
            <span className='relative'>
              <Search
                size={14}
                className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground2'
              />
              <input
                type='search'
                data-testid='filter-q'
                value={q}
                onChange={e => setParam('q', e.target.value)}
                placeholder='Search bikes and gear…'
                className='w-full rounded-xl border border-foreground/10 bg-white py-2 pl-9 pr-3 text-sm font-normal text-foreground outline-none focus:border-key1'
              />
            </span>
          </label>
          <label className='flex flex-col gap-1 text-xs font-semibold text-foreground2'>
            Category
            <select
              data-testid='filter-category'
              value={args.category ?? ''}
              onChange={e => setParam('category', e.target.value || null)}
              className='rounded-xl border border-foreground/10 bg-white px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-key1'
            >
              <option value=''>All</option>
              <option value='bike'>Bikes</option>
              <option value='accessory'>Accessories</option>
            </select>
          </label>
          <label className='flex flex-col gap-1 text-xs font-semibold text-foreground2'>
            Discipline
            <select
              data-testid='filter-discipline'
              value={args.discipline ?? ''}
              onChange={e => setParam('discipline', e.target.value || null)}
              className='rounded-xl border border-foreground/10 bg-white px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-key1'
            >
              <option value=''>All</option>
              <option value='road'>Road</option>
              <option value='gravel'>Gravel</option>
              <option value='commuter'>Commuter</option>
              <option value='mountain'>Mountain</option>
              <option value='e-bike'>E-bike</option>
            </select>
          </label>
          <label className='flex flex-col gap-1 text-xs font-semibold text-foreground2'>
            Max price ($)
            <input
              type='number'
              data-testid='filter-max-price'
              min={0}
              value={args.maxPriceUsd ?? ''}
              onChange={e => setParam('maxPrice', e.target.value)}
              placeholder='Any'
              className='w-28 rounded-xl border border-foreground/10 bg-white px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-key1'
            />
          </label>
          <label className='flex flex-col gap-1 text-xs font-semibold text-foreground2'>
            Your height (cm)
            <input
              type='number'
              data-testid='filter-height'
              min={0}
              value={args.riderHeightCm ?? ''}
              onChange={e => setParam('height', e.target.value)}
              placeholder='Fit any'
              className='w-28 rounded-xl border border-foreground/10 bg-white px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-key1'
            />
          </label>
          <label className='flex flex-col gap-1 text-xs font-semibold text-foreground2'>
            Sort
            <select
              data-testid='filter-sort'
              value={args.preferences?.prioritizeWeight ? 'weight' : ''}
              onChange={e => setParam('sort', e.target.value || null)}
              className='rounded-xl border border-foreground/10 bg-white px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-key1'
            >
              <option value=''>Best match · price</option>
              <option value='weight'>Lightest first</option>
            </select>
          </label>
          <label className='flex items-center gap-2 pb-2 text-xs font-semibold text-foreground2'>
            <input
              type='checkbox'
              data-testid='filter-stock'
              checked={args.inStockOnly === false}
              onChange={e => setParam('stock', e.target.checked ? 'all' : null)}
              className='h-4 w-4 accent-key1'
            />
            Include out of stock
          </label>
        </div>
        {extraChips.length > 0 && (
          <div className='mt-4 flex flex-wrap gap-2'>
            {extraChips.map(chip => (
              <button
                key={chip.param}
                onClick={() => setParam(chip.param, null)}
                className='flex items-center gap-1.5 rounded-full bg-key1/10 px-3 py-1 text-xs font-semibold text-key1 transition-opacity hover:opacity-80'
                title='Remove filter'
              >
                {chip.label}
                <X size={12} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {loading && !result ?
        <div className='py-24 text-center text-sm text-foreground2'>Finding your ride…</div>
      : visibleMatches.length === 0 ?
        <div className='card bg-white/80 py-20 text-center' data-testid='store-empty'>
          <p className='text-lg font-semibold'>No matches</p>
          <p className='mt-2 text-sm text-foreground2'>
            Nothing satisfies these filters — try widening the budget or clearing a filter.
          </p>
        </div>
      : <>
          <p className='mb-4 text-xs text-foreground2' data-testid='store-result-count'>
            {visibleMatches.length} of {result?.total ?? 0} matches
            {loading ? ' · updating…' : ''}
          </p>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3' data-testid='store-grid'>
            {visibleMatches.map(match => (
              <ProductCard
                key={match.product.id}
                match={match}
                selectedForCompare={compareIds.includes(match.product.id)}
                onToggleCompare={toggleCompare}
                onQuickAdd={quickAdd}
              />
            ))}
          </div>
        </>
      }

      {/* Compare tray */}
      {compareIds.length >= 1 && (
        <div className='fixed bottom-6 left-1/2 z-40 -translate-x-1/2' data-testid='compare-tray'>
          <div className='card flex items-center gap-4 bg-white/95 px-5 py-3 shadow-xl'>
            <span className='flex items-center gap-2 text-sm font-semibold'>
              <Scale size={15} className='text-key1' />
              {compareIds.length} selected
            </span>
            {compareIds.length >= 2 ?
              <Link
                href={`/store/compare?ids=${compareIds.join(',')}${
                  compareHeight !== undefined ? `&riderHeightCm=${compareHeight}` : ''
                }`}
                className='flex items-center gap-1.5 rounded-xl bg-key1 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90'
              >
                Compare
                <ArrowRight size={14} />
              </Link>
            : <span className='text-xs text-foreground2'>pick one more bike</span>}
            <button
              onClick={() => setCompareIds([])}
              className='text-xs font-semibold text-foreground2 hover:text-foreground'
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  match,
  selectedForCompare,
  onToggleCompare,
  onQuickAdd,
}: {
  match: Match;
  selectedForCompare: boolean;
  onToggleCompare(id: string): void;
  onQuickAdd(id: string): void;
}) {
  const { product } = match;
  const isBike = product.category === 'bike';
  return (
    <article
      className='card group flex flex-col overflow-hidden bg-white/80 transition-shadow hover:shadow-lg'
      data-testid={`product-card-${product.id}`}
    >
      <Link href={`/store/products/${product.id}`} className='block'>
        <ProductArt product={product} className='h-44 w-full' iconSize={72} />
      </Link>
      <div className='flex flex-1 flex-col p-5'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wider text-key1'>
              {isBike ? (product as Bike).discipline : product.kind}
            </p>
            <Link
              href={`/store/products/${product.id}`}
              className='mt-1 block font-bold leading-snug hover:text-key1'
            >
              {product.name}
            </Link>
          </div>
          <p className='whitespace-nowrap text-sm font-bold tabular-nums'>
            {formatUsd(product.priceUsd)}
          </p>
        </div>
        <p className='mt-2 line-clamp-2 text-sm text-foreground2'>{product.description}</p>
        <div className='mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground2'>
          <span className='rounded-full bg-background2 px-2 py-0.5'>{product.weightKg} kg</span>
          {isBike && (product as Bike).rangeKm !== undefined && (
            <span className='rounded-full bg-background2 px-2 py-0.5'>
              {(product as Bike).rangeKm} km range
            </span>
          )}
          {match.recommendedFrameSize && (
            <span
              className='rounded-full bg-key1/10 px-2 py-0.5 font-semibold text-key1'
              data-testid={`recommended-size-${product.id}`}
            >
              your size: {match.recommendedFrameSize}
            </span>
          )}
        </div>
        <p
          className='mt-2 truncate font-mono text-[10px] text-foreground2/70'
          title={match.reasonCodes.join(' · ')}
          data-testid={`reason-codes-${product.id}`}
        >
          #{match.rank} · {match.reasonCodes.join(' ')}
        </p>
        <div className='mt-4 flex items-center gap-2 border-t border-foreground/5 pt-4'>
          {isBike ?
            <>
              <Link
                href={`/store/products/${product.id}`}
                className='flex-1 rounded-xl bg-key1 px-3 py-2 text-center text-xs font-semibold text-white transition-opacity hover:opacity-90'
              >
                Choose size
              </Link>
              <button
                onClick={() => onToggleCompare(product.id)}
                data-testid={`compare-toggle-${product.id}`}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
                  selectedForCompare ?
                    'border-key1 bg-key1/10 text-key1'
                  : 'border-foreground/10 text-foreground2 hover:bg-gray-100',
                )}
              >
                <Scale size={13} />
                {selectedForCompare ? 'Selected' : 'Compare'}
              </button>
            </>
          : <button
              onClick={() => onQuickAdd(product.id)}
              disabled={!product.inStock}
              data-testid={`quick-add-${product.id}`}
              className='flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-key1 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40'
            >
              <Plus size={13} />
              Add to cart
            </button>
          }
        </div>
      </div>
    </article>
  );
}
