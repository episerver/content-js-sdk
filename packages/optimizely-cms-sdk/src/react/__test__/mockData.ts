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
