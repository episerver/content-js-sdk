import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { Suspense, use, useState } from 'react';
import { NextPreviewComponent } from '../nextjs.js';

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

const save = (previewUrl: string) =>
  act(() => {
    window.dispatchEvent(
      new CustomEvent('optimizely:cms:contentSaved', {
        detail: { contentLink: 'c1', previewUrl, previewToken: 't' },
      }),
    );
  });

const advance = (ms: number) => act(async () => void vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe('NextPreviewComponent', () => {
  test('refreshes the router 50ms after a save of the current page', async () => {
    render(<NextPreviewComponent />);

    save(window.location.href);
    await advance(49);
    expect(router.refresh).not.toHaveBeenCalled();
    await advance(1);

    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  test('pushes the path and query of a different page without scrolling', async () => {
    render(<NextPreviewComponent />);

    save(new URL('/other/page?ver=2#section', window.location.origin).href);
    await advance(50);

    expect(router.push).toHaveBeenCalledWith('/other/page?ver=2', { scroll: false });
    expect(router.refresh).not.toHaveBeenCalled();
  });

  test('keeps the loading indicator up until the refreshed page has rendered', async () => {
    let resolvePage: () => void = () => {};
    const pageLoaded = new Promise<void>(resolve => (resolvePage = resolve));

    function Page() {
      const [version, setVersion] = useState(0);
      router.refresh.mockImplementation(() => setVersion(it => it + 1));
      if (version > 0) use(pageLoaded);
      return <span>{`page ${version}`}</span>;
    }

    const { container } = render(
      <>
        <Suspense fallback='fallback'>
          <Page />
        </Suspense>
        <NextPreviewComponent>
          <i>loading</i>
        </NextPreviewComponent>
      </>,
    );

    save(window.location.href);
    await advance(50);
    await advance(1000);

    expect(container.textContent).toBe('page 0loading');

    await act(async () => resolvePage());

    expect(container.textContent).toBe('page 1');
  });
});
