import { describe, expect, test } from 'vitest';
import type React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import {
  createHtmlComponent,
  createImageComponent,
  createLeafComponent,
  createLinkComponent,
  createTableCellComponent,
  generateDefaultElements,
  generateDefaultLeafs,
} from '../richText/lib.js';
import {
  createElementData,
  defaultElementTypeMap,
  defaultMarkTypeMap,
} from '../../components/richText/renderer.js';

const element = (type: string, attributes: Record<string, unknown> = {}) => createElementData(type, attributes);

describe('createHtmlComponent', () => {
  test('renders the tag with converted attributes and children', () => {
    const Paragraph = createHtmlComponent('p');

    const { container } = render(
      <Paragraph element={element('paragraph')} attributes={{ class: 'lead', 'text-align': 'center' }}>
        Text
      </Paragraph>,
    );

    expect(container.querySelector('p.lead')).toHaveTextContent('Text');
    expect(container.querySelector('p')).toHaveStyle({ textAlign: 'center' });
  });

  test('drops children when self-closing', () => {
    const Rule = createHtmlComponent('hr', { selfClosing: true });

    const { container } = render(<Rule element={element('hr')}>ignored</Rule>);

    expect(container.querySelector('hr')).toBeEmptyDOMElement();
  });

  test('appends the config className to the element class', () => {
    const Div = createHtmlComponent('div', { className: 'from-config' });

    const { container } = render(<Div element={element('div')} attributes={{ class: 'from-cms' }} />);

    expect(container.querySelector('div')).toHaveAttribute('class', 'from-cms from-config');
  });

  test('lets config attributes override element attributes', () => {
    const Div = createHtmlComponent('div', { attributes: { title: 'from config' } });

    const { container } = render(<Div element={element('div')} attributes={{ title: 'from cms', id: 'kept' }} />);

    expect(container.querySelector('div')).toHaveAttribute('title', 'from config');
    expect(container.querySelector('div')).toHaveAttribute('id', 'kept');
  });
});

describe('specialised element components', () => {
  test('a link takes its href, target, rel and title from the element', () => {
    const Link = createLinkComponent('a', { className: 'link' });
    const link = element('link', { href: 'https://example.com', target: '_blank', rel: 'noopener', title: 'Go' });

    const { container } = render(<Link element={link as never}>Go</Link>);
    const anchor = container.querySelector('a');

    expect(anchor).toHaveAttribute('href', 'https://example.com');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener');
    expect(anchor).toHaveAttribute('title', 'Go');
    expect(anchor).toHaveClass('link');
  });

  test('an image takes its source from the element and renders no children', () => {
    const Image = createImageComponent();
    const image = element('image', { src: '/a.png', alt: 'A', loading: 'lazy' });

    const { container } = render(<Image element={image as never}>ignored</Image>);
    const img = container.querySelector('img');

    expect(img).toHaveAttribute('src', '/a.png');
    expect(img).toHaveAttribute('alt', 'A');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toBeEmptyDOMElement();
  });

  test('a table cell renders spans as attributes and dimensions as styles', () => {
    const Cell = createTableCellComponent('td');

    const { container } = render(
      <table>
        <tbody>
          <tr>
            <Cell element={element('td') as never} attributes={{ colspan: 2, width: '50%', height: '10px' }}>
              Cell
            </Cell>
          </tr>
        </tbody>
      </table>,
    );
    const cell = container.querySelector('td');

    expect(cell).toHaveAttribute('colspan', '2');
    expect(cell).toHaveStyle({ width: '50%', height: '10px' });
  });

  test('a leaf renders its tag with converted attributes', () => {
    const Mark = createLeafComponent('mark', { className: 'hl' });

    const { container } = render(
      <Mark leaf={{ text: 'x' }} attributes={{ class: 'note' }}>
        x
      </Mark>,
    );

    expect(container.querySelector('mark')).toHaveAttribute('class', 'note hl');
  });
});

// Parents that keep table and option tags valid, so React does not warn about nesting.
const parentTags: Record<string, string> = {
  tr: 'tbody',
  td: 'tr',
  th: 'tr',
  thead: 'table',
  tbody: 'table',
  tfoot: 'table',
  caption: 'table',
  option: 'select',
};

const renderInParent = (tag: string, ui: React.ReactElement) =>
  render(ui, { container: document.body.appendChild(document.createElement(parentTags[tag] ?? 'div')) }).container;

describe('generateDefaultElements', () => {
  const elements = generateDefaultElements();

  test('covers every default element type', () => {
    expect(Object.keys(elements).sort()).toEqual(Object.keys(defaultElementTypeMap).sort());
  });

  test.each(Object.entries(defaultElementTypeMap))('renders %s as its tag', (type, { tag }) => {
    const Element = elements[type];
    // An image without a source renders src="", which React warns about.
    const data = element(type, { src: '/a.png' });

    expect(renderInParent(tag, <Element element={data} />).firstElementChild?.tagName.toLowerCase()).toBe(tag);
  });

  test('gives the rich text root its class', () => {
    const Root = elements.richText;

    expect(renderInParent('div', <Root element={element('richText')} />).innerHTML).toBe(
      '<div class="cms:rich-text"></div>',
    );
  });
});

describe('generateDefaultLeafs', () => {
  const leafs = generateDefaultLeafs();

  test.each(Object.entries(defaultMarkTypeMap))('renders the %s mark as %s', (mark, tag) => {
    const Leaf = leafs[mark];

    expect(renderInParent('div', <Leaf leaf={{ text: 'x', [mark]: true }}>x</Leaf>).innerHTML).toBe(`<${tag}>x</${tag}>`);
  });

  test('covers every default mark', () => {
    expect(Object.keys(leafs).sort()).toEqual(Object.keys(defaultMarkTypeMap).sort());
  });
});
