import type { Node } from '../../components/richText/renderer.js';

/**
 * Mock RichText content for testing
 */
export const mockRichTextContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'This is a simple paragraph with ',
        },
        {
          text: 'bold text',
          bold: true,
        },
        {
          text: ' and ',
        },
        {
          text: 'italic text',
          italic: true,
        },
        {
          text: '.',
        },
      ],
    },
    {
      type: 'heading-one',
      children: [
        {
          text: 'Main Heading',
        },
      ],
    },
    {
      type: 'heading-two',
      children: [
        {
          text: 'Subheading',
        },
      ],
    },
    {
      type: 'bulleted-list',
      children: [
        {
          type: 'list-item',
          children: [
            {
              text: 'First list item',
            },
          ],
        },
        {
          type: 'list-item',
          children: [
            {
              text: 'Second list item with ',
            },
            {
              text: 'underlined text',
              underline: true,
            },
          ],
        },
      ],
    },
    {
      type: 'link',
      url: 'https://example.com',
      children: [
        {
          text: 'This is a link',
        },
      ],
    },
  ] as Node[],
};

/**
 * Simple text content for basic tests
 */
export const simpleTextContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Hello, World!',
        },
      ],
    },
  ] as Node[],
};

/**
 * Content with HTML entities for decoding tests
 */
export const htmlEntitiesContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Text with &lt;HTML&gt; entities &amp; symbols',
        },
      ],
    },
  ] as Node[],
};

/**
 * Content with unknown element type for fallback testing
 */
export const unknownElementContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'unknown-element',
      children: [
        {
          text: 'Content in unknown element',
        },
      ],
    },
  ] as Node[],
};

/**
 * Content with various text marks for leaf testing
 */
export const markedTextContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Normal text, ',
        },
        {
          text: 'bold text',
          bold: true,
        },
        {
          text: ', ',
        },
        {
          text: 'italic text',
          italic: true,
        },
        {
          text: ', ',
        },
        {
          text: 'underlined text',
          underline: true,
        },
        {
          text: ', ',
        },
        {
          text: 'code text',
          code: true,
        },
        {
          text: ', and ',
        },
        {
          text: 'strikethrough text',
          strikethrough: true,
        },
        {
          text: '.',
        },
      ],
    },
  ] as Node[],
};

// Element node with CMS "decoration" attribute - old format without prefix (GitHub issue #495)
export const styledSpanContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'paragraph',
      children: [
        {
          type: 'span',
          decoration: 'underline',
          children: [{ text: 'Hello world' }],
        },
      ],
    },
  ] as Node[],
};

// Element node with CMS "text-decoration" attribute - new kebab-case format (GitHub issue #495)
export const styledSpanKebabCaseContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'paragraph',
      children: [
        {
          type: 'span',
          'text-decoration': 'underline',
          children: [{ text: 'Hello world' }],
        },
      ],
    },
  ] as Node[],
};

export const imageContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'paragraph',
      children: [
        {
          type: 'image',
          url: 'https://example.com/photo.jpg',
          alt: 'A photo',
          title: 'Photo title',
          width: '320',
          children: [{ text: '' }],
        },
      ],
    },
  ] as Node[],
};

// The CMS sends `url`; the renderer exposes it as the anchor's `href`.
export const linkContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'https://example.com/page',
          target: '_blank',
          rel: 'noopener',
          title: 'Example page',
          children: [{ text: 'Example link' }],
        },
      ],
    },
  ] as Node[],
};

export const tableWithSpansContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'table',
      children: [
        {
          type: 'tbody',
          children: [
            {
              type: 'tr',
              children: [{ type: 'th', colspan: 2, width: '50%', children: [{ text: 'Wide header' }] }],
            },
            {
              type: 'tr',
              children: [
                { type: 'td', rowspan: 2, height: '40px', children: [{ text: 'Tall cell' }] },
                { type: 'td', children: [{ text: 'Plain cell' }] },
              ],
            },
          ],
        },
      ],
    },
  ] as Node[],
};

// An element type the SDK has no default for.
export const customElementContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'callout',
      tone: 'info',
      children: [{ text: 'Mind ' }, { text: 'the gap', bold: true }],
    },
  ] as Node[],
};

export const multiMarkContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'paragraph',
      children: [
        { text: 'bold italic', bold: true, italic: true },
        { text: ' and ' },
        { text: 'highlighted', highlight: true },
      ],
    },
  ] as Node[],
};

export const nestedListContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'bulleted-list',
      children: [
        {
          type: 'list-item',
          children: [
            { text: 'Outer' },
            {
              type: 'numbered-list',
              children: [
                {
                  type: 'list-item',
                  children: [
                    { text: 'Middle' },
                    {
                      type: 'bulleted-list',
                      children: [{ type: 'list-item', children: [{ text: 'Deep' }] }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ] as Node[],
};
