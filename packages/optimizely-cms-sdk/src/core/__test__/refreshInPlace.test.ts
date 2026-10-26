import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { refreshInPlace } from '../preview/refreshInPlace.js';

const CURRENT_URL = 'http://localhost:3000/preview?token=old';

/** A full page as the server renders it, with `content` inside the preview root. */
const page = (content: string) =>
  `<html><body><nav>Nav</nav><main data-optimizely-preview-root>${content}</main></body></html>`;

const render = (content: string) => {
  document.body.innerHTML = `<aside>Outside</aside><main data-optimizely-preview-root>${content}</main>`;
  return document.querySelector('main')!;
};

const response = (body: string, status = 200) => ({
  ok: status < 400,
  status,
  text: async () => body,
});

const respondWith = (...bodies: string[]) => {
  const fetchMock = vi.fn();
  bodies.forEach(body => fetchMock.mockResolvedValueOnce(response(body)));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

beforeEach(() => window.history.replaceState({}, '', CURRENT_URL));

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('patching', () => {
  test('replaces the root content with the refreshed page', async () => {
    const root = render('<h1>Old</h1>');
    respondWith(page('<h1>New</h1>'));

    await refreshInPlace()('http://localhost:3000/preview?token=new', false);

    expect(root.innerHTML).toBe('<h1>New</h1>');
  });

  test('keeps unchanged nodes in place', async () => {
    const root = render(
      '<section><h2>Old</h2><p>Same</p></section><footer>Same</footer>',
    );
    const [paragraph, footer] = [root.querySelector('p'), root.querySelector('footer')];
    respondWith(page('<section><h2>New</h2><p>Same</p></section><footer>Same</footer>'));

    await refreshInPlace()('http://localhost:3000/preview?token=new', false);

    expect(root.querySelector('h2')!.textContent).toBe('New');
    expect(root.querySelector('p')).toBe(paragraph);
    expect(root.querySelector('footer')).toBe(footer);
  });

  test('adds and removes nodes when the structure changes', async () => {
    const root = render('<p>One</p><p>Two</p><p>Three</p>');
    respondWith(page('<p>One</p><div>Added</div>'));

    await refreshInPlace()('http://localhost:3000/preview?token=new', false);

    expect(root.innerHTML).toBe('<p>One</p><div>Added</div>');
  });

  test('leaves the page outside the root untouched', async () => {
    render('<h1>Old</h1>');
    respondWith(page('<h1>New</h1>'));

    await refreshInPlace()('http://localhost:3000/preview?token=new', false);

    expect(document.querySelector('aside')!.textContent).toBe('Outside');
    expect(document.querySelector('nav')).toBeNull();
  });

  test('uses a custom root selector', async () => {
    document.body.innerHTML = '<div id="content"><h1>Old</h1></div>';
    respondWith('<div id="content"><h1>New</h1></div>');

    await refreshInPlace({ root: '#content' })(
      'http://localhost:3000/preview?token=new',
      false,
    );

    expect(document.querySelector('#content')!.innerHTML).toBe('<h1>New</h1>');
  });
});

describe('media', () => {
  test('an image whose URL differs only by preview token is kept', async () => {
    const root = render('<img src="/a.png?preview_token=old"><p>Old</p>');
    const image = root.querySelector('img');
    respondWith(page('<img src="/a.png?preview_token=new"><p>New</p>'));

    await refreshInPlace()('http://localhost:3000/preview?token=new', false);

    expect(root.querySelector('img')).toBe(image);
    expect(image!.getAttribute('src')).toBe('/a.png?preview_token=old');
  });

  test('a srcset that differs only by preview token is kept', async () => {
    const srcset = (token: string) =>
      `/a.png?w=1&preview_token=${token} 1x, /a.png?w=2&preview_token=${token} 2x`;
    const root = render(`<picture><source srcset="${srcset('old')}"></picture>`);
    const source = root.querySelector('source');
    respondWith(page(`<picture><source srcset="${srcset('new')}"></picture>`));

    await refreshInPlace()('http://localhost:3000/preview?token=new', false);

    expect(root.querySelector('source')).toBe(source);
  });

  test('an image that points at another asset is replaced', async () => {
    const root = render('<img src="/a.png?preview_token=old">');
    respondWith(page('<img src="/b.png?preview_token=new">'));

    await refreshInPlace()('http://localhost:3000/preview?token=new', false);

    expect(root.querySelector('img')!.getAttribute('src')).toBe(
      '/b.png?preview_token=new',
    );
  });
});

describe('request', () => {
  test('fetches the target path from the page origin', async () => {
    render('<h1>Old</h1>');
    const fetchMock = respondWith(page('<h1>New</h1>'));

    await refreshInPlace()('https://cms-host:4000/preview?token=new', false);

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'http://localhost:3000/preview?token=new',
    );
  });

  test('updates the address so a manual reload uses the latest token', async () => {
    render('<h1>Old</h1>');
    respondWith(page('<h1>New</h1>'));

    await refreshInPlace()('http://localhost:3000/preview?token=new', false);

    expect(window.location.search).toBe('?token=new');
  });

  test('a response superseded by a newer refresh is discarded', async () => {
    const root = render('<h1>Old</h1>');
    const resolvers: Record<string, () => void> = {};

    vi.stubGlobal(
      'fetch',
      vi.fn(
        (url: URL, { signal }: { signal: AbortSignal }) =>
          new Promise((resolve, reject) => {
            const token = url.searchParams.get('token')!;
            resolvers[token] = () => resolve(response(page(`<h1>${token}</h1>`)));
            signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      ),
    );

    const refresh = refreshInPlace();
    const first = refresh('http://localhost:3000/preview?token=first', false);
    const second = refresh('http://localhost:3000/preview?token=second', false);
    resolvers.second();
    resolvers.first();
    await Promise.all([first, second]);

    expect(root.innerHTML).toBe('<h1>second</h1>');
    expect(window.location.hash).toBe('');
  });
});

// jsdom implements navigation for hash changes only, so fallback targets differ by hash.
describe('falling back to a full reload', () => {
  const fallbackUrl = `${CURRENT_URL}#reloaded`;

  test('when the page has no preview root', async () => {
    document.body.innerHTML = '<h1>Old</h1>';
    const fetchMock = respondWith();

    await refreshInPlace()(fallbackUrl, false);

    expect(window.location.hash).toBe('#reloaded');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('when the request fails', async () => {
    render('<h1>Old</h1>');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('', 500)));

    await refreshInPlace()(fallbackUrl, false);

    expect(window.location.hash).toBe('#reloaded');
  });

  test('when the refreshed page has no preview root', async () => {
    render('<h1>Old</h1>');
    respondWith('<html><body><h1>New</h1></body></html>');

    await refreshInPlace()(fallbackUrl, false);

    expect(window.location.hash).toBe('#reloaded');
  });

  test('when the target is another page, without fetching it', async () => {
    render('<h1>Old</h1>');
    const fetchMock = respondWith();

    // jsdom logs "Not implemented: navigation to another Document" here
    await refreshInPlace()('http://localhost:3000/about', false);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
