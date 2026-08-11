'use client';
/**
 * StoreProvider — contracts.md §4 + §6.
 *
 * Mounts in the ROOT layout so `window.strideStoreBridge` exists on marketing
 * pages too. Owns the cart drawer, the Stride error/validation notice, the ONE
 * TelemetrySink instance, and the await-commit bridge: every bridge method
 * resolves only after router navigation AND the DOM reflect the new state.
 *
 * The human UI consumes the same /api/store/* routes and shows the same
 * surfaces through this provider — no parallel logic.
 */
import { useRouter } from 'next/navigation';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  Cart,
  CartMutationResult,
  Comparison,
  SearchResult,
  StoreError,
} from '../../lib/store/engine';
import { storeFetch } from './api';
import { argsToParams } from './searchParams';
import { CartDrawer } from './CartDrawer';
import { ErrorNotice } from './ErrorNotice';
import { createTelemetrySink, type TelemetrySink } from './telemetry';

export interface StrideStoreBridge {
  readonly version: 1;
  showSearch(result: SearchResult): Promise<void>;
  showComparison(comparison: Comparison): Promise<void>;
  showCart(cart: Cart, surface: 'drawer' | 'page'): Promise<void>;
  showErrorNotice(error: StoreError): Promise<void>;
  readonly telemetry: TelemetrySink;
}

declare global {
  interface Window {
    strideStoreBridge?: StrideStoreBridge;
  }
}

type Surface = 'search' | 'compare' | 'cart-page';
type SurfaceHandler = (payload: unknown) => void;

interface StoreContextValue {
  cart: Cart | null;
  drawerOpen: boolean;
  errorNotice: StoreError | null;
  telemetry: TelemetrySink;
  refreshCart(): Promise<void>;
  applyMutation(result: CartMutationResult, options?: { openDrawer?: boolean }): void;
  setCart(cart: Cart): void;
  openDrawer(): void;
  closeDrawer(): void;
  notifyError(error: StoreError): void;
  dismissError(): void;
  registerSurface(surface: Surface, handler: SurfaceHandler): () => void;
  ackSurface(surface: Surface): void;
  resetDemo(): Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [cart, setCartState] = useState<Cart | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [errorNotice, setErrorNotice] = useState<StoreError | null>(null);

  // --- the ONE TelemetrySink instance (§6) --------------------------------
  const telemetryRef = useRef<TelemetrySink | null>(null);
  if (telemetryRef.current === null) telemetryRef.current = createTelemetrySink();
  const telemetry = telemetryRef.current;

  // --- await-commit plumbing ----------------------------------------------
  // commit(): resolves after React has applied the state update to the DOM
  // (the flush effect below runs post-commit on every render).
  const commitResolvers = useRef<(() => void)[]>([]);
  const [, bumpCommit] = useState(0);
  const commit = useCallback((update: () => void): Promise<void> => {
    return new Promise<void>(resolve => {
      commitResolvers.current.push(resolve);
      update();
      bumpCommit(n => n + 1); // guarantee a render even if update() was a no-op
    });
  }, []);
  useEffect(() => {
    if (commitResolvers.current.length > 0) {
      const resolvers = commitResolvers.current.splice(0);
      resolvers.forEach(resolve => resolve());
    }
  });

  // deliver(): hands a payload to a page surface (mounting it via navigation
  // if needed); resolves when that page acks after applying it to the DOM.
  const surfaceHandlers = useRef(new Map<Surface, SurfaceHandler>());
  const pendingPayloads = useRef(new Map<Surface, unknown>());
  const pendingAcks = useRef(new Map<Surface, (() => void)[]>());

  const deliver = useCallback((surface: Surface, payload: unknown): Promise<void> => {
    return new Promise<void>(resolve => {
      const acks = pendingAcks.current.get(surface) ?? [];
      acks.push(resolve);
      pendingAcks.current.set(surface, acks);
      const handler = surfaceHandlers.current.get(surface);
      if (handler) handler(payload);
      else pendingPayloads.current.set(surface, payload);
    });
  }, []);

  const registerSurface = useCallback((surface: Surface, handler: SurfaceHandler) => {
    surfaceHandlers.current.set(surface, handler);
    const pending = pendingPayloads.current.get(surface);
    if (pending !== undefined) {
      pendingPayloads.current.delete(surface);
      handler(pending);
    }
    return () => {
      if (surfaceHandlers.current.get(surface) === handler) {
        surfaceHandlers.current.delete(surface);
      }
    };
  }, []);

  const ackSurface = useCallback((surface: Surface) => {
    const acks = pendingAcks.current.get(surface);
    if (acks && acks.length > 0) {
      pendingAcks.current.set(surface, []);
      acks.forEach(resolve => resolve());
    }
  }, []);

  const navigate = useCallback(
    (url: string, basePath: string) => {
      if (typeof window !== 'undefined' && window.location.pathname === basePath) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url);
      }
    },
    [router],
  );

  // --- shared UI actions ----------------------------------------------------
  const setCart = useCallback((next: Cart) => setCartState(next), []);

  const refreshCart = useCallback(async () => {
    const res = await storeFetch<Cart>('/api/store/cart');
    if (res.ok) setCartState(res.data);
  }, []);

  const applyMutation = useCallback(
    (result: CartMutationResult, options?: { openDrawer?: boolean }) => {
      setCartState(result.cart);
      if (options?.openDrawer !== false) setDrawerOpen(true);
    },
    [],
  );

  const notifyError = useCallback((error: StoreError) => setErrorNotice(error), []);
  const dismissError = useCallback(() => setErrorNotice(null), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const resetDemo = useCallback(async () => {
    // Reset demo: fresh session + empty cart/ledger; telemetry NOT touched (§6).
    const res = await storeFetch<{ sessionId: string }>('/api/store/session/reset', {
      method: 'POST',
    });
    if (res.ok) {
      setCartState({ sessionId: res.data.sessionId, items: [], itemCount: 0, subtotalUsd: 0 });
      setDrawerOpen(false);
      setErrorNotice(null);
      navigate('/store', '/store');
      router.refresh();
    }
  }, [navigate, router]);

  // Initial cart hydration (count badge on first paint).
  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  // --- window.strideStoreBridge (§4) ---------------------------------------
  const bridge = useMemo<StrideStoreBridge>(() => {
    const showSearch = (result: SearchResult): Promise<void> => {
      const params = argsToParams(result.args);
      const qs = params.toString();
      const done = deliver('search', result);
      navigate(qs ? `/store?${qs}` : '/store', '/store');
      return done;
    };
    const showComparison = (comparison: Comparison): Promise<void> => {
      const params = new URLSearchParams();
      params.set('ids', comparison.products.map(p => p.id).join(','));
      if (comparison.riderHeightCm !== undefined) {
        params.set('riderHeightCm', String(comparison.riderHeightCm));
      }
      const done = deliver('compare', comparison);
      navigate(`/store/compare?${params.toString()}`, '/store/compare');
      return done;
    };
    const showCart = (nextCart: Cart, surface: 'drawer' | 'page'): Promise<void> => {
      if (surface === 'drawer') {
        return commit(() => {
          setCartState(nextCart);
          setDrawerOpen(true);
        });
      }
      const done = deliver('cart-page', nextCart);
      setCartState(nextCart);
      navigate('/store/cart', '/store/cart');
      return done;
    };
    const showErrorNotice = (error: StoreError): Promise<void> => {
      return commit(() => setErrorNotice(error));
    };
    return Object.freeze({
      version: 1 as const,
      showSearch,
      showComparison,
      showCart,
      showErrorNotice,
      telemetry,
    });
  }, [commit, deliver, navigate, telemetry]);

  useEffect(() => {
    window.strideStoreBridge = bridge;
    return () => {
      if (window.strideStoreBridge === bridge) delete window.strideStoreBridge;
    };
  }, [bridge]);

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      drawerOpen,
      errorNotice,
      telemetry,
      refreshCart,
      applyMutation,
      setCart,
      openDrawer,
      closeDrawer,
      notifyError,
      dismissError,
      registerSurface,
      ackSurface,
      resetDemo,
    }),
    [
      cart,
      drawerOpen,
      errorNotice,
      telemetry,
      refreshCart,
      applyMutation,
      setCart,
      openDrawer,
      closeDrawer,
      notifyError,
      dismissError,
      registerSurface,
      ackSurface,
      resetDemo,
    ],
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <CartDrawer />
      <ErrorNotice />
    </StoreContext.Provider>
  );
}
