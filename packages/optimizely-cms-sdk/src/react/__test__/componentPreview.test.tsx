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
  return (
    <>
      <h2 data-size={displaySettings?.size}>{content.Text}</h2>
      <img src={content.Image?.url?.default} alt='' />
    </>
  );
}

// jsdom has no ResizeObserver, which the height reporter observes with.
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
    expect(getContent).toHaveBeenCalledWith({ key: 'abc123', locale: 'sv' });
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

  test('reports its height so the embedding frame can size itself', async () => {
    const heights: number[] = [];
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'preview-height') heights.push(event.data.height);
    };
    window.addEventListener('message', onMessage);
    // jsdom has no layout, so the reporter needs a height to find.
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(420);
    // `window.parent === window` in jsdom, which the reporter reads as "not framed".
    vi.spyOn(window, 'parent', 'get').mockReturnValue({
      postMessage: (data: unknown) => window.dispatchEvent(
        Object.assign(new Event('message'), { data }),
      ),
    } as unknown as Window);

    await renderPage({ contentType: 'Heading' });
    await new Promise(resolve => setTimeout(resolve));

    expect(heights).toContain(420);

    window.removeEventListener('message', onMessage);
    vi.restoreAllMocks();
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
