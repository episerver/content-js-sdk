/**
 * Text node with formatting marks
 * Based on Slate.js JSON structure
 */
export type Text = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  strikethrough?: boolean;
  [key: string]: unknown; // allow custom marks (e.g., highlight, color)
};

/**
 * Element node (blocks and inline elements)
 * Based on Slate.js JSON structure
 */
export type Element = {
  type: string; // e.g., 'paragraph', 'heading-one', 'link', 'image'
  children: Node[];
  url?: string; // common on 'link', 'image', 'video'
  class?: string; // allow headless CMS to pass CSS classes
  [key: string]: unknown; // custom attributes
};

/**
 * Union type for all possible nodes (text or element)
 * Based on Slate.js JSON structure
 */
export type Node = Text | Element;

/**
 * Type guard to check if a node is a text node
 */
export function isText(node: Node): node is Text {
  return (node as Text).text !== undefined;
}

/**
 * Type guard to check if a node is an element node
 */
export function isElement(node: Node): node is Element {
  return !isText(node);
}

/**
 * Utility type to extract text content from Slate.js content
 */
export type Content = Node[];

/**
 * Utility type for working with specific element types
 */
export type ElementOfType<T extends ElementType> = Element & {
  type: T;
};

/**
 * Utility type for working with text nodes with specific marks
 */
export type TextWithMark<T extends MarkType> = Text & {
  [K in T]: true;
};

/**
 * Available element types in the default implementation
 */
export type ElementType =
  | 'paragraph'
  | 'heading-one'
  | 'heading-two'
  | 'heading-three'
  | 'heading-four'
  | 'heading-five'
  | 'heading-six'
  | 'bulleted-list'
  | 'numbered-list'
  | 'list-item'
  | 'table'
  | 'tbody'
  | 'tr'
  | 'td'
  | 'th'
  | 'quote'
  | 'link'
  | 'image'
  | 'br'
  | 'code'
  | 'pre'
  | 'var'
  | 'samp'
  | 'div'
  | 'richText';

/**
 * Available text marks in the default implementation
 */
export type MarkType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code';

/**
 * Configuration for creating HTML components
 */
export type HtmlComponentConfig = {
  selfClosing?: boolean;
  attributes?: Record<string, unknown>;
  className?: string;
};

/**
 * Framework-agnostic renderer configuration
 */
export type RendererConfig<TElement = unknown, TText = unknown> = {
  elements?: Record<string, TElement>;
  leafs?: Record<string, TText>;
  unknownElementFallback?: string | TElement;
  decodeHtmlEntities?: boolean;
};

// Reserved props that should not be passed as HTML attributes
export const RESERVED_PROPS = new Set([
  'url',
  'children',
  'type',
  'internal',
  'base',
]);

/**
 * Maps CMS attributes to standard HTML attributes
 */
export function mapAttributes(node: Element): Record<string, unknown> {
  const nodeProps: Record<string, unknown> = {};

  // Copy non-reserved props verbatim
  Object.keys(node).forEach((k) => {
    if (!RESERVED_PROPS.has(k)) {
      nodeProps[k] = node[k as keyof Element];
    }
  });

  // Map `class` attribute (standard HTML)
  if ('class' in node) {
    nodeProps.class = node.class;
  }

  // Map URL-ish attributes based on common element semantics
  if ('url' in node) {
    switch (node.type) {
      case 'link':
        nodeProps.href = node.url;
        break;
      case 'image':
      case 'video':
        nodeProps.src = node.url;
        break;
      default:
        nodeProps['data-url'] = node.url;
        break;
    }
  }

  return nodeProps;
}

/**
 * Gets text marks from a text node
 */
export function getTextMarks(leaf: Text): string[] {
  return Object.keys(leaf).filter(
    (k) => k !== 'text' && leaf[k as keyof Text] === true
  );
}

/**
 * Extracts plain text content from element children recursively
 * This provides a developer-friendly way to access text without traversing the tree
 */
export function extractTextContent(children: Node[]): string {
  return children
    .map((child) => {
      if (isText(child)) {
        return child.text;
      } else {
        // Recursively extract text from nested elements
        return extractTextContent(child.children);
      }
    })
    .join('');
}

/**
 * Minimal HTML entity decoder to avoid extra deps
 */
export function decodeHTML(input: string): string {
  if (!/[&<>"]/.test(input)) return input;

  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': '\u00A0',
  };

  return input.replace(
    /(&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;)/g,
    (m) => map[m] ?? m
  );
}

/**
 * Framework-agnostic rendering traversal logic
 * Returns a tree structure that can be consumed by any framework
 */
export interface RenderNode {
  type: 'element' | 'text';
  content?: string; // for text nodes
  elementType?: string; // for element nodes
  attributes?: Record<string, unknown>; // for element nodes
  marks?: string[]; // for text nodes
  children?: RenderNode[];
}

/**
 * Converts Slate JSON to framework-agnostic render tree
 */
export function buildRenderTree(
  nodes: Node[],
  config: RendererConfig = {}
): RenderNode[] {
  if (!Array.isArray(nodes)) {
    return [];
  }
  return nodes.map((node) => buildRenderNode(node, config));
}

function buildRenderNode(node: Node, config: RendererConfig): RenderNode {
  if (isText(node)) {
    const content =
      config.decodeHtmlEntities && typeof node.text === 'string'
        ? decodeHTML(node.text)
        : node.text;

    return {
      type: 'text',
      content,
      marks: getTextMarks(node),
    };
  } else {
    return {
      type: 'element',
      elementType: node.type,
      attributes: mapAttributes(node),
      children: buildRenderTree(node.children, config),
    };
  }
}

/**
 * Default element type mapping
 */
export const defaultElementTypeMap: Record<
  string,
  { tag: string; config?: HtmlComponentConfig }
> = {
  // Blocks
  paragraph: { tag: 'p' },
  'heading-one': { tag: 'h1' },
  'heading-two': { tag: 'h2' },
  'heading-three': { tag: 'h3' },
  'heading-four': { tag: 'h4' },
  'heading-five': { tag: 'h5' },
  'heading-six': { tag: 'h6' },

  // Lists
  'bulleted-list': { tag: 'ul' },
  'numbered-list': { tag: 'ol' },
  'list-item': { tag: 'li' },

  quote: { tag: 'blockquote' },

  // Code-related elements
  code: { tag: 'code' },
  pre: { tag: 'pre' },
  var: { tag: 'var' },
  samp: { tag: 'samp' },

  // Inlines
  link: { tag: 'a' },
  image: { tag: 'img', config: { selfClosing: true } },
  br: { tag: 'br', config: { selfClosing: true } },

  // Table
  table: { tag: 'table' },
  tbody: { tag: 'tbody' },
  tr: { tag: 'tr' },
  td: { tag: 'td' },
  th: { tag: 'th' },

  // Root wrapper
  richText: { tag: 'div', config: { className: 'cms:rich-text' } },
};

/**
 * Default text mark mapping
 */
export const defaultMarkTypeMap: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strikethrough: 's',
};
