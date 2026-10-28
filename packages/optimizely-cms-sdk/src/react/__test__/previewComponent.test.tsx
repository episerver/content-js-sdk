import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useState } from 'react';
import '@testing-library/jest-dom/vitest';
import { PreviewComponent } from '../client.js';

const dispatch = (detail: object) =>
  window.dispatchEvent(new CustomEvent('optimizely:cms:contentSaved', { detail }));

/** The CMS's token message, then its ready message. */
const save = (link: string | number) =>
  act(() => {
    const message = {
      contentLink: `c${link}`,
      previewUrl: window.location.href,
      previewToken: 't',
    };
    dispatch({ ...message, sectionId: 's' });
    dispatch(message);
  });

const advance = (ms: number) => act(async () => void vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('PreviewComponent', () => {
  test('keeps a pending refresh alive when the parent re-renders', async () => {
    const onNavigate = vi.fn();
    let bump: () => void = () => {};

    function Parent() {
      const [, setN] = useState(0);
      bump = () => setN(x => x + 1);
      // Unstable identity, exactly like NextPreviewComponent's inline arrow
      return <PreviewComponent refreshTimeout={300} onNavigate={(u, s) => onNavigate(u, s)} />;
    }

    render(<Parent />);
    save(1);
    await advance(100);
    await act(async () => bump());
    await advance(500);

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test('defaults to a 50ms trailing debounce', async () => {
    const onNavigate = vi.fn();
    render(<PreviewComponent onNavigate={onNavigate} />);

    save(1);
    await advance(49);
    expect(onNavigate).toHaveBeenCalledTimes(0);
    await advance(1);
    expect(onNavigate).toHaveBeenCalledWith(window.location.href, true);
  });

  test('keeps the loading indicator up while `busy` is set', async () => {
    const mask = <div>loading</div>;
    const props = { refreshTimeout: 100, onNavigate: () => undefined };

    const { container, rerender } = render(
      <PreviewComponent {...props} busy={false}>
        {mask}
      </PreviewComponent>,
    );

    save(1);
    expect(container.textContent).toBe('loading');

    // `onNavigate` returns void, so the internal mask drops immediately - `busy` covers the round-trip.
    await act(async () => {
      vi.advanceTimersByTime(100);
      rerender(
        <PreviewComponent {...props} busy={true}>
          {mask}
        </PreviewComponent>,
      );
    });
    expect(container.textContent).toBe('loading');

    rerender(
      <PreviewComponent {...props} busy={false}>
        {mask}
      </PreviewComponent>,
    );
    expect(container.textContent).toBe('');
  });

  test('renders nothing while busy when it has no loading indicator', () => {
    const { container } = render(<PreviewComponent busy />);

    expect(container).toBeEmptyDOMElement();
  });

  test('stops listening and drops a pending refresh on unmount', async () => {
    const onNavigate = vi.fn();
    const { unmount } = render(<PreviewComponent onNavigate={onNavigate} />);

    save(1);
    unmount();
    await advance(100);
    save(2);
    await advance(100);

    expect(onNavigate).not.toHaveBeenCalled();
  });
});
