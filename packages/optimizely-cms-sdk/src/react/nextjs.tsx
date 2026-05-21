'use client';

// @ts-ignore - next/navigation is optional peer dependency
import { useRouter } from 'next/navigation';
import { PreviewComponent } from './client.js';
import type { ReactNode } from 'react';

export interface NextPreviewComponentProps {
  /**
   * Delay in ms before triggering navigation. False to disable.
   * Useful for debouncing rapid saves.
   * @default 300
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
 *   return <NextPreviewComponent refreshTimeout={300} />;
 * }
 * ```
 */
export function NextPreviewComponent({
  refreshTimeout = 300,
  children,
}: NextPreviewComponentProps = {}) {
  const router = useRouter();

  return (
    <PreviewComponent
      refreshTimeout={refreshTimeout}
      onNavigate={(url: string, isSameUrl: boolean) => {
        if (isSameUrl) {
          // Same URL - soft refresh to revalidate Server Components
          router.refresh();
        } else {
          // Different URL - client-side navigation
          const parsed = new URL(url);
          router.push(parsed.pathname + parsed.search, { scroll: false });
        }
      }}
    >
      {children}
    </PreviewComponent>
  );
}
