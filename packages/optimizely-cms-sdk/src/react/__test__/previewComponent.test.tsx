import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useState } from 'react';
import { PreviewComponent } from '../client.js';

const save = (link: string | number) =>
  act(() => {
    window.dispatchEvent(
      new CustomEvent('optimizely:cms:contentSaved', {
        detail: {
          contentLink: `c${link}`,
          previewUrl: window.location.href,
          previewToken: 't',
        },
      }),
    );
  });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('PreviewComponent', () => {
  it('keeps a pending refresh alive when the parent re-renders', async () => {
    const onNavigate = vi.fn();
    let bump: () => void = () => {};

    function Parent() {
      const [, setN] = useState(0);
      bump = () => setN(x => x + 1);
      // Unstable identity, exactly like NextPreviewComponent's inline arrow
      return (
        <PreviewComponent refreshTimeout={300} onNavigate={(u, s) => onNavigate(u, s)} />
      );
    }

    render(<Parent />);
    save(1);
    await act(async () => void vi.advanceTimersByTime(100));
    await act(async () => bump());
    await act(async () => void vi.advanceTimersByTime(500));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('defaults to a 50ms trailing debounce', async () => {
    const onNavigate = vi.fn();
    render(<PreviewComponent onNavigate={onNavigate} />);

    save(1);
    await act(async () => void vi.advanceTimersByTime(49));
    expect(onNavigate).toHaveBeenCalledTimes(0);
    await act(async () => void vi.advanceTimersByTime(1));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('coalesces the burst the CMS emits for one save', async () => {
    const onNavigate = vi.fn();
    render(<PreviewComponent onNavigate={onNavigate} />);

    // Page plus two nested blocks, different contentLinks, a few ms apart
    await act(async () => {
      save('page');
      vi.advanceTimersByTime(5);
      save('blockA');
      vi.advanceTimersByTime(5);
      save('blockB');
      vi.advanceTimersByTime(500);
    });
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('still dedupes repeats when debouncing is disabled', async () => {
    const onNavigate = vi.fn();
    render(<PreviewComponent refreshTimeout={false} onNavigate={onNavigate} />);

    await act(async () => {
      save('page');
      save('page');
    });
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('keeps the loading indicator up while `busy` is set', async () => {
    const mask = <div>loading</div>;
    const props = { refreshTimeout: 100, onNavigate: () => undefined };

    const { container, rerender } = render(
      <PreviewComponent {...props} busy={false}>
        {mask}
      </PreviewComponent>,
    );

    save(1);
    expect(container.textContent).toBe('loading');

    // Navigation starts: `onNavigate` returns void, so the internal mask drops
    // immediately - `busy` is what covers the actual server round-trip.
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
});
