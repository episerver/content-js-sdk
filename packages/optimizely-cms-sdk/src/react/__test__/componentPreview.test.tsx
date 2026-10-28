import { describe, expect, test, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useFormValidation } from '../forms/index.js';
import { createStandalonePreview } from '../standalone.js';
import { initReactComponentRegistry } from '../server.js';
import {
  contentType,
  displayTemplate,
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '../../model/index.js';

const getContent = vi.fn();

vi.mock('../../graph/index.js', async importOriginal => ({
  ...(await importOriginal<typeof import('../../graph/index.js')>()),
  getClient: () => ({ getContent }),
}));

const HeadingType = contentType({
  key: 'Heading',
  displayName: 'Heading',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Text: { type: 'string', displayName: 'Headline' },
    Image: { type: 'contentReference', allowedTypes: ['_image'] },
  },
});

const HeadingStyles = displayTemplate({
  key: 'HeadingStyles',
  displayName: 'Heading styles',
  isDefault: true,
  contentType: 'Heading',
  settings: {
    size: {
      displayName: 'Size',
      sortOrder: 1,
      choices: {
        small: { displayName: 'Small', sortOrder: 2 },
        large: { displayName: 'Large', sortOrder: 1 },
      },
    },
  },
});

function Heading({ content, displaySettings }: any) {
  // `data-faded` records the raw type, so a boolean arriving as a string shows up.
  return (
    <>
      <h2
        data-size={displaySettings?.size}
        data-faded={typeof displaySettings?.fadeOut}
      >
        {content.Text}
      </h2>
      <img src={content.Image?.url?.default} alt='' />
    </>
  );
}

// jsdom has neither of these. Without `decode` the reporter correctly falls
// back to waiting out its own image timeout, which would make every test slow.
HTMLImageElement.prototype.decode ??= () => Promise.resolve();

// jsdom has no ResizeObserver, which the reporter observes the component with.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as never;

beforeEach(() => {
  getContent.mockReset();
  initContentTypeRegistry([HeadingType]);
  initDisplayTemplateRegistry([HeadingStyles]);
  initReactComponentRegistry({ resolver: { Heading } });
});

/** Resolves every async server component in a tree, which `render` cannot. */
async function resolveAsync(node: any): Promise<any> {
  if (Array.isArray(node)) return Promise.all(node.map(resolveAsync));
  if (!node || typeof node !== 'object' || !('type' in node)) return node;

  if (node.type?.constructor?.name === 'AsyncFunction') {
    return resolveAsync(await node.type(node.props));
  }

  if (node.props?.children) {
    const children = await resolveAsync(node.props.children);
    return { ...node, props: { ...node.props, children } };
  }

  return node;
}

/** Runs the page the way the router does. */
async function renderPage(
  searchParams: Record<string, string>,
  options: Record<string, unknown> = {},
) {
  const Page = createStandalonePreview({ defaultLocale: 'en', ...options }) as any;
  const element = await Page({ searchParams: Promise.resolve(searchParams) });

  return render(await resolveAsync(element));
}

describe('createStandalonePreview', () => {
  test('renders a content type from generated stand-in content', async () => {
    const { container } = await renderPage({ type: 'Heading' });

    expect(container.querySelector('h2')?.textContent).toBe('Headline');
    // The placeholder is inline, so the frame needs nothing from the network.
    expect(container.querySelector('img')?.getAttribute('src')).toMatch(
      /^data:image\/svg\+xml/,
    );
    expect(getContent).not.toHaveBeenCalled();
    // The frame takes the embedding page's backdrop, not a white canvas.
    expect(container.querySelector('style')?.textContent).toContain(
      'background:transparent',
    );
  });

  test('never fetches real content, whatever the URL asks for', async () => {
    // This route takes no preview token and does no authorization, so it
    // serves generated content only. `key` stays a reserved parameter so an
    // old URL fails loudly rather than becoming a display setting.
    const { container } = await renderPage({ key: 'abc123', loc: 'sv' });

    expect(getContent).not.toHaveBeenCalled();
    expect(container.querySelector('h2')).toBeNull();
  });

  test('a display template supplies its first choice, a query parameter overrides it', async () => {
    const asDefault = await renderPage({
      type: 'Heading',
      template: 'HeadingStyles',
    });
    expect(asDefault.container.querySelector('h2')?.dataset.size).toBe('large');

    const overridden = await renderPage({
      type: 'Heading',
      template: 'HeadingStyles',
      size: 'small',
    });
    expect(overridden.container.querySelector('h2')?.dataset.size).toBe('small');
  });

  /**
   * jsdom has no layout engine, so the measured element reports a zero-sized
   * box unless one is supplied. It also makes `window.parent === window`, which
   * the reporter reads as "not framed", so the parent is stood in for too.
   */
  function framed({ height = 420, width = 1280 } = {}) {
    const sent: any[] = [];

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width,
      height,
      left: 0,
      top: 0,
      right: width,
      bottom: height,
    } as DOMRect);

    vi.spyOn(window, 'parent', 'get').mockReturnValue({
      postMessage: (data: unknown, targetOrigin: string) =>
        sent.push({ data, targetOrigin }),
    } as unknown as Window);

    return sent;
  }

  test('reports the component box, not the full-width wrapper around it', async () => {
    const sent = framed();

    // The wrapper is full-width by design, so a component narrower than the
    // page must still report its own width or every tile frames whitespace.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element) {
        const narrow = this.id !== 'optimizely-preview';
        return {
          width: narrow ? 150 : 1280,
          height: narrow ? 60 : 420,
          left: narrow ? 565 : 0,
          top: narrow ? 330 : 0,
          right: narrow ? 715 : 1280,
          bottom: narrow ? 390 : 420,
        } as DOMRect;
      },
    );

    await renderPage(
      { type: 'Heading' },
      { parentOrigin: 'https://cms.test' },
    );
    await vi.waitFor(() => expect(sent).not.toHaveLength(0));

    expect(sent[0].data.payload).toMatchObject({
      width: 150,
      height: 60,
      offsetX: 565,
      offsetY: 330,
    });
  });

  test('reports the component box so the embedding page can size a tile', async () => {
    const sent = framed({ height: 420, width: 1280 });

    await renderPage(
      { type: 'Heading' },
      { parentOrigin: 'https://cms.test' },
    );
    await vi.waitFor(() => expect(sent).not.toHaveLength(0));

    expect(sent[0].data.type).toBe('optimizely:preview:dimensions');
    expect(sent[0].data.version).toBe(1);
    expect(sent[0].data.payload).toMatchObject({
      width: 1280,
      height: 420,
      offsetX: 0,
      offsetY: 0,
      // The payload field keeps its full name; only the URL is short.
      contentType: 'Heading',
    });
  });

  test('writes the measurement onto the element, for tools that cannot listen', async () => {
    // A screenshot runner loads the preview as a page of its own, so it is
    // never framed and `postMessage` reaches nobody. The DOM is its channel.
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue(undefined);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 257, height: 48, left: 43, top: 72, right: 300, bottom: 120,
    } as DOMRect);

    await renderPage({ type: 'Heading' });

    const element = () => document.getElementById('optimizely-preview');
    await vi.waitFor(() => expect(element()?.hasAttribute('data-preview-ready')).toBe(true));

    expect(element()?.getAttribute('data-preview-width')).toBe('257');
    expect(element()?.getAttribute('data-preview-height')).toBe('48');
    expect(element()?.getAttribute('data-preview-offset-x')).toBe('43');
    expect(element()?.getAttribute('data-preview-offset-y')).toBe('72');
    vi.restoreAllMocks();
  });

  test('marks a component that could not render, so a runner can skip it', async () => {
    await renderPage({ type: 'NotRegistered' });

    await vi.waitFor(() =>
      expect(
        document.getElementById('optimizely-preview')?.getAttribute('data-preview-error'),
      ).toBe('unknown-content-type'),
    );
  });

  test('ignores a mock declared for a different content type, and says so', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'development');

    // The component registered for `Heading`, carrying a mock that names
    // something else: a copy-paste between component files.
    const Wrong = () => null;
    (Wrong as any)[Symbol.for('optimizely.mock')] = {
      contentType: 'SomethingElse',
      data: { Text: 'from the wrong component' },
    };
    initReactComponentRegistry({ resolver: { Heading: Wrong } });

    const { container } = await renderPage({ type: 'Heading' });

    expect(container.textContent).not.toContain('from the wrong component');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('withMock'));

    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    initReactComponentRegistry({ resolver: { Heading } });
  });

  /** A `message` from an embedder, as the frame's window would receive it. */
  function request(origin: string, data: unknown) {
    window.dispatchEvent(new MessageEvent('message', { origin, data }));
  }

  test('answers a measure request, so a resized frame is not left stale', async () => {
    const sent = framed({ width: 150, height: 60 });

    await renderPage(
      { type: 'Heading' },
      { parentOrigin: 'https://cms.test' },
    );
    await vi.waitFor(() => expect(sent).toHaveLength(1));

    // Nothing about the component changed — the frame around it did, which
    // it cannot see. The answer comes because it was asked for.
    request('https://cms.test', {
      type: 'optimizely:preview:measure',
      version: 1,
    });

    await vi.waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1].data.type).toBe('optimizely:preview:dimensions');
    expect(sent[1].data.payload).toMatchObject({ width: 150, height: 60 });
  });

  test('ignores a measure request from an origin the page does not trust', async () => {
    const sent = framed();

    await renderPage(
      { type: 'Heading' },
      { parentOrigin: 'https://cms.test' },
    );
    await vi.waitFor(() => expect(sent).toHaveLength(1));

    request('https://evil.test', {
      type: 'optimizely:preview:measure',
      version: 1,
    });
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(sent).toHaveLength(1);
  });

  test('reports a component that moved without changing size', async () => {
    const sent = framed();

    // Same 150×60 button, recentred by a frame that changed width. Its own
    // box never changes, so the resize observer stays quiet; an embedder
    // cropping to the old offset would frame the wrong region.
    let left = 565;
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element) {
        const narrow = this.id !== 'optimizely-preview';
        return {
          width: narrow ? 150 : 1280,
          height: narrow ? 60 : 420,
          left: narrow ? left : 0,
          top: narrow ? 330 : 0,
          right: narrow ? left + 150 : 1280,
          bottom: narrow ? 390 : 420,
        } as DOMRect;
      },
    );

    await renderPage(
      { type: 'Heading' },
      { parentOrigin: 'https://cms.test' },
    );
    await vi.waitFor(() => expect(sent).toHaveLength(1));

    // The frame resizing, not the embedder asking: nothing here is forced,
    // so this only arrives if a moved box counts as a change.
    left = 365;
    window.dispatchEvent(new Event('resize'));

    await vi.waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1].data.payload).toMatchObject({
      width: 150,
      height: 60,
      offsetX: 365,
    });
  });

  test('a drag of the frame costs one measurement, not one per event', async () => {
    const sent = framed();

    const measured = vi.spyOn(Element.prototype, 'getBoundingClientRect');

    await renderPage(
      { type: 'Heading' },
      { parentOrigin: 'https://cms.test' },
    );
    await vi.waitFor(() => expect(sent).toHaveLength(1));

    measured.mockClear();
    for (let event = 0; event < 20; event++) {
      window.dispatchEvent(new Event('resize'));
    }
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    await new Promise(resolve => setTimeout(resolve, 20));

    // Refitting reads layout back, so a dragged panel firing continuously
    // would otherwise thrash every frame on the page.
    expect(measured.mock.calls.length).toBeLessThan(20);
  });

  test('posts to the origin it was given, never to a wildcard', async () => {
    const sent = framed();

    await renderPage(
      { type: 'Heading' },
      { parentOrigin: 'https://cms.test' },
    );
    await vi.waitFor(() => expect(sent).not.toHaveLength(0));

    expect(sent[0].targetOrigin).toBe('https://cms.test');
  });

  test('generated content is in the locale the URL asked for', async () => {
    // Components format dates and numbers from this, so a preview asked for
    // one locale must not hand them another.
    const Locale = ({ content }: any) => (
      <span data-testid='locale'>{content._metadata.locale}</span>
    );
    initReactComponentRegistry({ resolver: { Heading: Locale } });

    // Scoped to each render's own container: both stay in the document.
    const localeOf = ({ container }: { container: HTMLElement }) =>
      container.querySelector('[data-testid="locale"]')?.textContent;

    expect(localeOf(await renderPage({ type: 'Heading', loc: 'sv' }))).toBe('sv');
    expect(localeOf(await renderPage({ type: 'Heading' }))).toBe('en');

    initReactComponentRegistry({ resolver: { Heading } });
  });

  test('stays silent when no origin is named and none is configured', async () => {
    const sent = framed();
    // Pinned: with `OPTIMIZELY_CMS_URL` set in the environment this would
    // report to it, and the test would pass or fail by accident.
    vi.stubEnv('OPTIMIZELY_CMS_URL', '');

    await renderPage({ type: 'Heading' });
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(sent).toHaveLength(0);
    vi.unstubAllEnvs();
  });

  test('reports an error rather than leaving the parent to time out', async () => {
    const sent = framed();

    await renderPage(
      { type: 'NotRegistered' },
      { parentOrigin: 'https://cms.test' },
    );
    await vi.waitFor(() => expect(sent).not.toHaveLength(0));

    expect(sent[0].data.type).toBe('optimizely:preview:error');
    expect(sent[0].data.payload.code).toBe('unknown-content-type');
  });

  test('an unknown content type renders a message instead of throwing', async () => {
    // The shared fallback only shows itself in development, as elsewhere.
    vi.stubEnv('NODE_ENV', 'development');

    const { container } = await renderPage({ type: 'NotRegistered' });

    expect(container.textContent).toContain('NotRegistered');
    expect(container.querySelector('h2')).toBeNull();

    vi.unstubAllEnvs();
  });
});

describe('form elements previewed on their own', () => {
  const FieldType = contentType({
    key: 'Field',
    displayName: 'Field',
    baseType: '_component',
    properties: { Label: { type: 'string' } },
  });

  /** Reads the context a form container normally provides. */
  function Field() {
    const { attemptedSubmit } = useFormValidation();
    return <input data-testid='field' data-attempted={String(attemptedSubmit)} />;
  }

  test('render without a container instead of throwing', async () => {
    initContentTypeRegistry([FieldType]);
    initReactComponentRegistry({ resolver: { Field } });

    const { getByTestId } = await renderPage({ type: 'Field' });

    expect(getByTestId('field').dataset.attempted).toBe('false');
  });
});

describe('router conventions', () => {
  /** Routers differ in how they hand over the query; all three must work. */
  async function renderWith(searchParams: unknown) {
    const Page = createStandalonePreview({ defaultLocale: 'en' }) as any;
    const element = await Page({ searchParams });
    return render(await resolveAsync(element));
  }

  test('a plain object, as most routers pass it', async () => {
    const { container } = await renderWith({ type: 'Heading' });
    expect(container.querySelector('h2')?.textContent).toBe('Headline');
  });

  test('URLSearchParams, as `new URL(request.url).searchParams` gives', async () => {
    const { container } = await renderWith(
      new URLSearchParams({ type: 'Heading', size: 'small' }),
    );
    expect(container.querySelector('h2')?.dataset.size).toBe('small');
  });

  test('a promise, as the Next App Router passes it', async () => {
    const { container } = await renderWith(Promise.resolve({ type: 'Heading' }));
    expect(container.querySelector('h2')?.textContent).toBe('Headline');
  });
})

describe('fixes from review', () => {
  test('a boolean setting arrives as a boolean, as it does on a real page', async () => {
    const { container } = await renderPage({
      type: 'Heading',
      fadeOut: 'false',
    });

    // Not the string 'false', which is truthy and would invert the setting.
    expect(container.querySelector('h2')?.dataset.faded).toBe('boolean');
  });

  test('a URL asking only for a content key reports that it rendered nothing', async () => {
    const sent: any[] = [];
    vi.spyOn(window, 'parent', 'get').mockReturnValue({
      postMessage: (data: unknown) => sent.push(data),
    } as unknown as Window);

    await renderPage({ key: 'does-not-exist' }, { parentOrigin: 'https://cms.test' });
    await vi.waitFor(() => expect(sent).not.toHaveLength(0));

    // No content type named, so there was never anything to render.
    expect(sent[0].payload.code).toBe('render-failed');
    expect(getContent).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
})

describe('parentOrigin', () => {
  function listening() {
    const sent: any[] = [];
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue(undefined);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 200, height: 40, left: 0, top: 0, right: 200, bottom: 40,
    } as DOMRect);
    vi.spyOn(window, 'parent', 'get').mockReturnValue({
      postMessage: (data: unknown, targetOrigin: string) => sent.push({ data, targetOrigin }),
    } as unknown as Window);
    return sent;
  }

  async function renderFor(parentOrigin?: string) {
    const Page = createStandalonePreview({ defaultLocale: 'en', parentOrigin }) as any;
    const element = await Page({
      searchParams: Promise.resolve({ type: 'Heading' }),
    });
    render(await resolveAsync(element));
  }

  test('reports to the origin the page names', async () => {
    const sent = listening();

    await renderFor('https://cms.test');
    await vi.waitFor(() => expect(sent).not.toHaveLength(0));

    expect(sent[0].targetOrigin).toBe('https://cms.test');
    vi.restoreAllMocks();
  });

  test('reports to OPTIMIZELY_CMS_URL without being told to', async () => {
    const sent = listening();
    vi.stubEnv('OPTIMIZELY_CMS_URL', 'https://cms.test');

    // Nothing passed: the CMS is the embedder this exists for.
    await renderFor(undefined);
    await vi.waitFor(() => expect(sent).toHaveLength(1));

    expect(sent[0].targetOrigin).toBe('https://cms.test');
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test('an origin passed in wins over the environment', async () => {
    const sent = listening();
    vi.stubEnv('OPTIMIZELY_CMS_URL', 'https://cms.test');

    await renderFor('https://preview-tool.test');
    await vi.waitFor(() => expect(sent).toHaveLength(1));

    expect(sent[0].targetOrigin).toBe('https://preview-tool.test');
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test('keeps only the origin, so a URL with a path still matches', async () => {
    const sent = listening();

    // `event.origin` on the receiving side is always bare, so a configured
    // URL carrying a path would otherwise match nothing.
    await renderFor('https://cms.test/some/path');
    await vi.waitFor(() => expect(sent).toHaveLength(1));

    expect(sent[0].targetOrigin).toBe('https://cms.test');
    vi.restoreAllMocks();
  });

  test('a request cannot name itself: the query parameter is ignored', async () => {
    const sent = listening();

    const Page = createStandalonePreview({ defaultLocale: 'en' }) as any;
    const element = await Page({
      searchParams: Promise.resolve({
        type: 'Heading',
        parentOrigin: 'https://evil.test',
      }),
    });
    render(await resolveAsync(element));
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(sent).toHaveLength(0);
    vi.restoreAllMocks();
  });
})

describe('a framed preview with nowhere to report', () => {
  test('says so while developing, instead of going quiet', async () => {
    vi.spyOn(window, 'parent', 'get').mockReturnValue({
      postMessage: () => {},
    } as unknown as Window);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'development');

    const Page = createStandalonePreview({ defaultLocale: 'en' }) as any;
    render(
      await resolveAsync(
        await Page({ searchParams: Promise.resolve({ type: 'Heading' }) }),
      ),
    );
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('parentOrigin'));

    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
})

describe('fit', () => {
  const styleOf = async (options: Record<string, unknown>) => {
    const Page = createStandalonePreview({ defaultLocale: 'en', ...options }) as any;
    const { container } = render(
      await resolveAsync(
        await Page({ searchParams: Promise.resolve({ type: 'Heading' }) }),
      ),
    );
    return container.querySelector('style')?.textContent ?? '';
  };

  test('contains the component by default, so nothing is cropped', async () => {
    expect(await styleOf({})).toContain('overflow:hidden');
  });

  test('`none` lets the page scroll instead', async () => {
    expect(await styleOf({ fit: 'none' })).not.toContain('overflow:hidden');
  });

  test('fits inside the edges, not flush against them', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue(undefined);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 1000, height: 100, left: 0, top: 0, right: 1000, bottom: 100,
    } as DOMRect);
    // 516 wide fits a 1000px component flush at 0.516; the 8px inset per side
    // leaves 500 for it, so a gap at the edge shows up as a rounder number.
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(516);
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(1000);

    await styleOf({});

    await vi.waitFor(() =>
      expect(document.getElementById('optimizely-preview')?.style.transform).toBe(
        'scale(0.5)',
      ),
    );
    vi.restoreAllMocks();
  });
})
