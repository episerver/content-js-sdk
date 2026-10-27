import { afterEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { RichText } from '../richText/component.js';
import type { ElementProps, LeafProps } from '../richText/lib.js';
import type { Node } from '../../components/richText/renderer.js';
import { configureAdapter } from '../../context/config.js';
import { MemoryAdapter } from '../../core/context/memoryAdapter.js';
import {
  simpleTextContent,
  mockRichTextContent,
  htmlEntitiesContent,
  unknownElementContent,
  markedTextContent,
  styledSpanContent,
  styledSpanKebabCaseContent,
  imageContent,
  linkContent,
  tableWithSpansContent,
  customElementContent,
  multiMarkContent,
  nestedListContent,
} from './mockData.js';

describe('RichText Component', () => {
  test('renders simple text content', () => {
    render(<RichText content={simpleTextContent} />);
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });

  test('renders different elements correctly', () => {
    render(<RichText content={mockRichTextContent} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Main Heading');
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveTextContent('This is a link');
  });

  test('renders nothing for null content', () => {
    const { container } = render(<RichText content={null as any} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('decodes HTML entities by default', () => {
    render(<RichText content={htmlEntitiesContent} />);
    expect(screen.getByText('Text with <HTML> entities & symbols')).toBeInTheDocument();
  });

  test('leaves HTML entities alone when decoding is off', () => {
    render(<RichText content={htmlEntitiesContent} decodeHtmlEntities={false} />);
    expect(screen.getByText('Text with &lt;HTML&gt; entities &amp; symbols')).toBeInTheDocument();
  });

  test('renders an unknown element as a span', () => {
    render(<RichText content={unknownElementContent} />);
    expect(screen.getByText('Content in unknown element').tagName).toBe('SPAN');
  });

  test('renders text with various formatting marks', () => {
    render(<RichText content={markedTextContent} />);

    expect(screen.getByText('bold text').tagName.toLowerCase()).toBe('strong');
    expect(screen.getByText('italic text').tagName.toLowerCase()).toBe('em');
    expect(screen.getByText('underlined text').tagName.toLowerCase()).toBe('u');
    expect(screen.getByText('code text').tagName.toLowerCase()).toBe('code');
    expect(screen.getByText('strikethrough text').tagName.toLowerCase()).toBe('s');
  });

  test('nests every mark on a text with several', () => {
    render(<RichText content={multiMarkContent} />);
    const text = screen.getByText('bold italic');

    expect(text.closest('strong')).not.toBeNull();
    expect(text.closest('em')).not.toBeNull();
  });

  test('renders an unknown mark as a span', () => {
    render(<RichText content={multiMarkContent} />);
    expect(screen.getByText('highlighted').tagName).toBe('SPAN');
  });

  test('renders styled span with decoration as text-decoration style (old format)', () => {
    render(<RichText content={styledSpanContent} />);
    const el = screen.getByText('Hello world');
    expect(el.tagName.toLowerCase()).toBe('span');
    expect(el).toHaveStyle('text-decoration: underline');
  });

  test('renders styled span with text-decoration as text-decoration style (new kebab-case format)', () => {
    render(<RichText content={styledSpanKebabCaseContent} />);
    const el = screen.getByText('Hello world');
    expect(el.tagName.toLowerCase()).toBe('span');
    expect(el).toHaveStyle('text-decoration: underline');
  });

  test('renders content delivered as a serialized JSON string', () => {
    render(<RichText content={JSON.stringify(simpleTextContent) as any} />);
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });

  test('renders nothing for a malformed JSON string instead of throwing', () => {
    expect(() => render(<RichText content={'{"children":' as any} />)).not.toThrow();
  });

  test('renders a link with its url, target, rel and title', () => {
    render(<RichText content={linkContent} />);
    const link = screen.getByRole('link', { name: 'Example link' });

    expect(link).toHaveAttribute('href', 'https://example.com/page');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
    expect(link).toHaveAttribute('title', 'Example page');
  });

  test('renders table cell spans and moves cell dimensions to styles', () => {
    const { container } = render(<RichText content={tableWithSpansContent} />);
    const header = screen.getByText('Wide header');
    const tallCell = screen.getByText('Tall cell');

    expect(header).toHaveAttribute('colspan', '2');
    expect(header).toHaveStyle({ width: '50%' });
    expect(header).not.toHaveAttribute('width');
    expect(tallCell).toHaveAttribute('rowspan', '2');
    expect(tallCell).toHaveStyle({ height: '40px' });
    expect(container.querySelectorAll('td')).toHaveLength(2);
  });

  test('renders an element with no children as an empty element', () => {
    const content = { type: 'richText' as const, children: [{ type: 'paragraph', children: [] }] as Node[] };

    const { container } = render(<RichText content={content} />);

    expect(container.querySelector('p')).toBeEmptyDOMElement();
  });

  test('renders deeply nested lists', () => {
    const { container } = render(<RichText content={nestedListContent} />);

    expect(container.querySelector('ul > li > ol > li > ul > li')).toHaveTextContent('Deep');
  });
});

describe('RichText wrapper', () => {
  test('renders the content without a wrapper by default', () => {
    const { container } = render(<RichText content={simpleTextContent} />);

    expect(container.firstElementChild?.tagName).toBe('P');
  });

  test('wraps the content in a div carrying extra HTML attributes', () => {
    const { container } = render(<RichText content={simpleTextContent} data-epi-edit='Body' className='prose' />);
    const wrapper = container.firstElementChild;

    expect(wrapper?.tagName).toBe('DIV');
    expect(wrapper).toHaveAttribute('data-epi-edit', 'Body');
    expect(wrapper).toHaveClass('prose');
    expect(wrapper?.querySelector('p')).toHaveTextContent('Hello, World!');
  });
});

describe('RichText overrides', () => {
  test('renders custom elements with the element data and its text, whatever the key casing', () => {
    const received: ElementProps[] = [];
    const Callout = (props: ElementProps) => {
      received.push(props);
      return <aside data-tone={String(props.element.tone)}>{props.children}</aside>;
    };

    const { container } = render(<RichText content={customElementContent} elements={{ CALLOUT: Callout }} />);

    expect(container.querySelector('aside')).toHaveAttribute('data-tone', 'info');
    expect(container.querySelector('aside strong')).toHaveTextContent('the gap');
    expect(received[0]).toMatchObject({ text: 'Mind the gap', element: { type: 'callout', tone: 'info' } });
  });

  test('overrides a default element', () => {
    const Heading = ({ children }: ElementProps) => <h1 className='title'>{children}</h1>;

    render(<RichText content={mockRichTextContent} elements={{ 'Heading-One': Heading }} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('title');
  });

  test('passes link data to a custom link element', () => {
    const received: ElementProps[] = [];
    const Link = (props: ElementProps) => {
      received.push(props);
      return <a>{props.children}</a>;
    };

    render(<RichText content={linkContent} elements={{ link: Link }} />);

    expect(received[0].element).toMatchObject({
      type: 'link',
      url: 'https://example.com/page',
      target: '_blank',
      rel: 'noopener',
      title: 'Example page',
    });
  });

  test('renders custom leafs with the leaf data and its text, whatever the key casing', () => {
    const received: LeafProps[] = [];
    const Bold = (props: LeafProps) => {
      received.push(props);
      return <b className='custom'>{props.children}</b>;
    };

    render(<RichText content={markedTextContent} leafs={{ Bold }} />);

    expect(screen.getByText('bold text')).toHaveClass('custom');
    expect(received[0]).toMatchObject({ text: 'bold text', leaf: { text: 'bold text', bold: true } });
  });
});

describe('RichText images', () => {
  afterEach(() => configureAdapter(undefined as never));

  test('renders an image with its source and attributes when no context adapter is configured', () => {
    const { container } = render(<RichText content={imageContent} />);
    const image = container.querySelector('img');

    expect(image).toHaveAttribute('src', 'https://example.com/photo.jpg');
    expect(image).toHaveAttribute('alt', 'A photo');
    expect(image).toHaveAttribute('title', 'Photo title');
    expect(image).toHaveAttribute('width', '320');
    expect(image).toBeEmptyDOMElement();
  });

  test('adds the preview token from context to the image source when the preview opted in', () => {
    const adapter = new MemoryAdapter();
    adapter.set('previewToken', 'token-1');
    adapter.set('usePreviewToken', true);
    configureAdapter(adapter);

    const { container } = render(<RichText content={imageContent} />);

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/photo.jpg?preview_token=token-1');
  });
});
