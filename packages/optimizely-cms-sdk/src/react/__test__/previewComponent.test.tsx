import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useState } from 'react';
import '@testing-library/jest-dom/vitest';
import { PreviewComponent } from '../client.js';

const dispatch = (detail: object) =>
  window.dispatchEvent(new CustomEvent('optimizely:cms:contentSaved', { detail }));

/** The CMS's token message, then its ready message. */
const save = () =>
  act(() => {
    const message = {
      contentLink: 'c1',
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
    save();
    await advance(100);
    await act(async () => bump());
    await advance(500);

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test('defaults to a 50ms trailing debounce', async () => {
    const onNavigate = vi.fn();
    render(<PreviewComponent onNavigate={onNavigate} />);

    save();
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

    save();
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

    save();
    unmount();
    await advance(100);
    save();
    await advance(100);

    expect(onNavigate).not.toHaveBeenCalled();
  });

  test('retries failed media on the CMS host with the preview token', () => {
    const image = 'https://cms.example.com/globalassets/cat.jpg';
    const { container } = render(
      <>
        <PreviewComponent onNavigate={vi.fn()} cmsUrl='https://cms.example.com' />
        <img src={image} />
      </>,
    );

    save();
    act(() => void container.querySelector('img')!.dispatchEvent(new Event('error')));

    expect(container.querySelector('img')).toHaveAttribute('src', `${image}?preview_token=t`);
  });
});
