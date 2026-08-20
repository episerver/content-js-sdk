'use client';

// @ts-ignore - next/navigation is optional peer dependency
import { useRouter } from 'next/navigation';
import { PreviewComponent } from './client.js';
import { useTransition, type ReactNode } from 'react';

export interface NextPreviewComponentProps {
  /**
   * Delay in ms before triggering navigation. False to disable.
   * Coalesces the burst of events the CMS emits for a single save.
   * @default 50
   */
  refreshTimeout?: number | false;

  /**
   * Optional loading indicator shown during refresh delay.
   */
  children?: ReactNode;
}

/**
 * Next.js-specific PreviewComponent with automatic router integration.
 * Handles soft refresh (router.refresh) for same-URL updates and navigation for different URLs.
 *
 * @example
 * ```tsx
 * import { NextPreviewComponent } from '@optimizely/cms-sdk/react/nextjs';
 *
 * export default function PreviewPage() {
 *   return <NextPreviewComponent refreshTimeout={50} />;
 * }
 * ```
 */
export function NextPreviewComponent({
  refreshTimeout = 50,
  children,
}: NextPreviewComponentProps = {}) {
  const router = useRouter();

  // `router.refresh()` and `router.push()` return void, so the loading indicator would
  // otherwise disappear a microtask later. Inside a transition `isPending` stays true
  // until the new Server Component payload has actually landed.
  const [isPending, startTransition] = useTransition();

  return (
    <PreviewComponent
      refreshTimeout={refreshTimeout}
      busy={isPending}
      onNavigate={(url: string, isSameUrl: boolean) => {
        startTransition(() => {
          if (isSameUrl) {
            // Same URL - soft refresh to revalidate Server Components
            router.refresh();
          } else {
            // Different URL - client-side navigation
            const parsed = new URL(url);
            router.push(parsed.pathname + parsed.search, { scroll: false });
          }
        });
      }}
    >
      {children}
    </PreviewComponent>
  );
}
