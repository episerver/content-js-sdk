import { describe, expect, test, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useFormValidation } from '../forms/index.js';
import { createComponentPreviewPage, initReactComponentRegistry } from '../server.js';
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
async function renderPage(searchParams: Record<string, string>) {
  const Page = createComponentPreviewPage({ defaultLocale: 'en' }) as any;
  const element = await Page({ searchParams: Promise.resolve(searchParams) });

  return render(await resolveAsync(element));
}

describe('createComponentPreviewPage', () => {
  test('renders a content type from generated stand-in content', async () => {
    const { container } = await renderPage({ contentType: 'Heading' });

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

  test('renders real content when given a key', async () => {
    getContent.mockResolvedValue({
      __typename: 'Heading',
      Text: 'Set it. Sweat it.',
      _metadata: { key: 'abc123', types: ['Heading'], locale: 'sv' },
    });

    const { container } = await renderPage({ key: 'abc123', locale: 'sv' });

    expect(container.querySelector('h2')?.textContent).toBe('Set it. Sweat it.');
    expect(getContent).toHaveBeenCalledWith(
      { key: 'abc123', locale: 'sv' },
      { publishedOnly: true },
    );
  });

  test('a display template supplies its first choice, a query parameter overrides it', async () => {
    const asDefault = await renderPage({
      contentType: 'Heading',
      displayTemplate: 'HeadingStyles',
    });
    expect(asDefault.container.querySelector('h2')?.dataset.size).toBe('large');

    const overridden = await renderPage({
      contentType: 'Heading',
      displayTemplate: 'HeadingStyles',
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

    await renderPage({ contentType: 'Heading', parentOrigin: 'https://cms.test' });
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

    await renderPage({ contentType: 'Heading', parentOrigin: 'https://cms.test' });
    await vi.waitFor(() => expect(sent).not.toHaveLength(0));

    expect(sent[0].data.type).toBe('optimizely:preview:ready');
    expect(sent[0].data.version).toBe(1);
    expect(sent[0].data.payload).toMatchObject({
      width: 1280,
      height: 420,
      offsetX: 0,
      offsetY: 0,
      element: 'optimizely-preview',
      contentType: 'Heading',
    });
  });

  test('posts to the origin it was given, never to a wildcard', async () => {
    const sent = framed();

    await renderPage({ contentType: 'Heading', parentOrigin: 'https://cms.test' });
    await vi.waitFor(() => expect(sent).not.toHaveLength(0));

    expect(sent[0].targetOrigin).toBe('https://cms.test');
  });

  test('stays silent when no parent origin is given', async () => {
    const sent = framed();

    await renderPage({ contentType: 'Heading' });
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(sent).toHaveLength(0);
  });

  test('reports an error rather than leaving the parent to time out', async () => {
    const sent = framed();

    await renderPage({ contentType: 'NotRegistered', parentOrigin: 'https://cms.test' });
    await vi.waitFor(() => expect(sent).not.toHaveLength(0));

    expect(sent[0].data.type).toBe('optimizely:preview:error');
    expect(sent[0].data.payload.code).toBe('unknown-content-type');
  });

  test('an unknown content type renders a message instead of throwing', async () => {
    // The shared fallback only shows itself in development, as elsewhere.
    vi.stubEnv('NODE_ENV', 'development');

    const { container } = await renderPage({ contentType: 'NotRegistered' });

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

    const { getByTestId } = await renderPage({ contentType: 'Field' });

    expect(getByTestId('field').dataset.attempted).toBe('false');
  });
});

describe('router conventions', () => {
  /** Routers differ in how they hand over the query; all three must work. */
  async function renderWith(searchParams: unknown) {
    const Page = createComponentPreviewPage({ defaultLocale: 'en' }) as any;
    const element = await Page({ searchParams });
    return render(await resolveAsync(element));
  }

  test('a plain object, as most routers pass it', async () => {
    const { container } = await renderWith({ contentType: 'Heading' });
    expect(container.querySelector('h2')?.textContent).toBe('Headline');
  });

  test('URLSearchParams, as `new URL(request.url).searchParams` gives', async () => {
    const { container } = await renderWith(
      new URLSearchParams({ contentType: 'Heading', size: 'small' }),
    );
    expect(container.querySelector('h2')?.dataset.size).toBe('small');
  });

  test('a promise, as the Next App Router passes it', async () => {
    const { container } = await renderWith(Promise.resolve({ contentType: 'Heading' }));
    expect(container.querySelector('h2')?.textContent).toBe('Headline');
  });
})

describe('fixes from review', () => {
  test('a boolean setting arrives as a boolean, as it does on a real page', async () => {
    const { container } = await renderPage({
      contentType: 'Heading',
      fadeOut: 'false',
    });

    // Not the string 'false', which is truthy and would invert the setting.
    expect(container.querySelector('h2')?.dataset.faded).toBe('boolean');
  });

  test('a missing content key is reported as such, not as an unknown type', async () => {
    const sent: any[] = [];
    vi.spyOn(window, 'parent', 'get').mockReturnValue({
      postMessage: (data: unknown) => sent.push(data),
    } as unknown as Window);
    getContent.mockResolvedValue(null);

    await renderPage({ key: 'does-not-exist', parentOrigin: 'https://cms.test' });
    await vi.waitFor(() => expect(sent).not.toHaveLength(0));

    expect(sent[0].payload.code).toBe('content-not-found');
    vi.restoreAllMocks();
  });

  test('a key lookup asks for published content, whatever the app configured', async () => {
    getContent.mockResolvedValue({
      __typename: 'Heading',
      Text: 'x',
      _metadata: { key: 'abc', types: ['Heading'], locale: 'en' },
    });

    await renderPage({ key: 'abc' });

    expect(getContent).toHaveBeenCalledWith(
      { key: 'abc', locale: 'en' },
      { publishedOnly: true },
    );
  });
})
