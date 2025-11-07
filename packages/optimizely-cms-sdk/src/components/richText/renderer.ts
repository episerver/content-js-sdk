/**
 * Base element properties shared by all element types
 */
export interface BaseElement {
  children: Node[];
  class?: string; // allow headless CMS to pass CSS classes
  [key: string]: unknown; // custom attributes
}

/**
 * Generic element for types that don't need special properties
 */
export interface GenericElement extends BaseElement {
  type: GenericElementType;
}

/**
 * Link element with required href (mapped from url)
 */
export interface LinkElement extends BaseElement {
  type: 'link';
  url: string; // Required for links - will be mapped to href
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
  title?: string;
}

/**
 * Image element with required src (mapped from url)
 */
export interface ImageElement extends BaseElement {
  type: 'image';
  url: string; // Required for images - will be mapped to src
  alt?: string;
  title?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
}

/**
 * Table element with table-specific attributes
 */
export interface TableElement extends BaseElement {
  type: 'table';
  border?: string | number;
  cellpadding?: string | number;
  cellspacing?: string | number;
  width?: string | number;
  height?: string | number;
}

/**
 * Table cell elements with table-specific attributes
 */
export interface TableCellElement extends BaseElement {
  type: 'td' | 'th';
  colspan?: number;
  rowspan?: number;
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
}

/**
 * Element node (blocks and inline elements) - Discriminated Union
 * Based on Slate.js JSON structure with type-specific properties
 */
export type Element =
  | GenericElement
  | LinkElement
  | ImageElement
  | TableElement
  | TableCellElement;

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
 * Props for element renderer components (framework-agnostic)
 */
export interface BaseElementRendererProps {
  element: Element;
  attributes?: Record<string, unknown>;
  text?: string; // Enhanced API - direct text access (optional for backward compatibility)
}

/**
 * Props for leaf renderer components (framework-agnostic)
 */
export interface BaseLeafRendererProps {
  leaf: Text;
  attributes?: Record<string, unknown>;
  text?: string; // Enhanced API - direct text access (optional for backward compatibility)
}

/**
 * Generic mapping from element types to renderer components
 * Can be specialized for each framework: ElementMap<ReactComponent>, ElementMap<VueComponent>, etc.
 */
export type BaseElementMap<TRenderer = unknown> = {
  [K in ElementType]?: TRenderer;
} & {
  [key: string]: TRenderer;
};

/**
 * Generic mapping from leaf mark types to renderer components
 * Can be specialized for each framework: LeafMap<ReactComponent>, LeafMap<VueComponent>, etc.
 */
export type BaseLeafMap<TRenderer = unknown> = {
  [K in MarkType]?: TRenderer;
} & {
  [key: string]: TRenderer;
};

/**
 * Generic props for RichText component (framework-agnostic)
 * Can be specialized for each framework with specific renderer types
 */
export interface RichTextPropsBase<
  TElementRenderer = unknown,
  TLeafRenderer = unknown
> {
  /**
   * Slate.js compatible JSON content to render
   */
  content?: {
    type: 'richText';
    children: Node[];
  };

  /**
   * Custom components for rendering elements by type
   */
  elements?: BaseElementMap<TElementRenderer>;

  /**
   * Custom components for rendering text marks
   */
  leafs?: BaseLeafMap<TLeafRenderer>;

  /**
   * Whether to decode HTML entities in text content
   */
  decodeHtmlEntities?: boolean;
}

/**
 * Available element types in the default implementation
 * Derived from the actual Element discriminated union to ensure consistency
 */
export type ElementType = Element['type'];

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

  // Map URL-ish attributes based on specific element types (type-safe)
  switch (node.type) {
    case 'link':
      nodeProps.href = node.url;
      if (node.target) nodeProps.target = node.target;
      if (node.rel) nodeProps.rel = node.rel;
      if (node.title) nodeProps.title = node.title;
      break;
    case 'image':
      nodeProps.src = node.url;
      if (node.alt) nodeProps.alt = node.alt;
      if (node.title) nodeProps.title = node.title;
      if (node.width) nodeProps.width = node.width;
      if (node.height) nodeProps.height = node.height;
      if (node.loading) nodeProps.loading = node.loading;
      break;
    case 'table':
      if (node.border) nodeProps.border = node.border;
      if (node.cellpadding) nodeProps.cellpadding = node.cellpadding;
      if (node.cellspacing) nodeProps.cellspacing = node.cellspacing;
      if (node.width) nodeProps.width = node.width;
      if (node.height) nodeProps.height = node.height;
      break;
    case 'td':
    case 'th':
      if (node.colspan) nodeProps.colspan = node.colspan;
      if (node.rowspan) nodeProps.rowspan = node.rowspan;
      if (node.scope) nodeProps.scope = node.scope;
      break;
    default:
      // For generic elements, check if they have a url and map it as data-url
      if ('url' in node && node.url) {
        nodeProps['data-url'] = node.url;
      }
      break;
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
 * Creates type-safe element data based on element type and attributes
 * This is a utility function that can be used by framework-specific renderers
 */
export function createElementData(
  type: string,
  attributes: Record<string, unknown> = {}
): Element {
  const baseProps = { children: [], ...attributes };

  switch (type) {
    case 'link':
      return {
        type: 'link',
        url: (attributes.url as string) || (attributes.href as string) || '',
        target: attributes.target as any,
        rel: attributes.rel as string,
        title: attributes.title as string,
        ...baseProps,
      };
    case 'image':
      return {
        type: 'image',
        url: (attributes.url as string) || (attributes.src as string) || '',
        alt: attributes.alt as string,
        title: attributes.title as string,
        width: attributes.width as number | string,
        height: attributes.height as number | string,
        loading: attributes.loading as 'lazy' | 'eager',
        ...baseProps,
      };
    case 'table':
      return {
        type: 'table',
        border: attributes.border as string | number,
        cellpadding: attributes.cellpadding as string | number,
        cellspacing: attributes.cellspacing as string | number,
        width: attributes.width as string | number,
        height: attributes.height as string | number,
        ...baseProps,
      };
    case 'td':
    case 'th':
      return {
        type: type as 'td' | 'th',
        colspan: attributes.colspan as number,
        rowspan: attributes.rowspan as number,
        scope: attributes.scope as any,
        ...baseProps,
      };
    default:
      // For generic elements, we need to cast to the proper generic type
      return {
        type: type as any, // Type assertion for generic elements
        ...baseProps,
      } as Element;
  }
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
    '&mdash;': '—',
  };

  return input.replace(
    /(&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;|&mdash;)/g,
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
  div: { tag: 'div' },
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

  // Text-level semantics (inline)
  span: { tag: 'span' },
  mark: { tag: 'mark' },
  strong: { tag: 'strong' },
  em: { tag: 'em' },
  u: { tag: 'u' },
  s: { tag: 's' },
  i: { tag: 'i' },
  b: { tag: 'b' },
  small: { tag: 'small' },
  sub: { tag: 'sub' },
  sup: { tag: 'sup' },
  ins: { tag: 'ins' },
  del: { tag: 'del' },
  kbd: { tag: 'kbd' },
  abbr: { tag: 'abbr' },
  cite: { tag: 'cite' },
  dfn: { tag: 'dfn' },
  q: { tag: 'q' },
  data: { tag: 'data' },
  bdo: { tag: 'bdo' },
  bdi: { tag: 'bdi' },

  // Interactive elements
  link: { tag: 'a' },
  a: { tag: 'a' },
  button: { tag: 'button' },
  label: { tag: 'label' },

  // Media (when inline)
  image: { tag: 'img', config: { selfClosing: true } },
  img: { tag: 'img', config: { selfClosing: true } },
  canvas: { tag: 'canvas' },

  // Form elements
  input: { tag: 'input', config: { selfClosing: true } },
  select: { tag: 'select' },
  textarea: { tag: 'textarea' },

  // Other inline elements
  br: { tag: 'br', config: { selfClosing: true } },
  wbr: { tag: 'wbr', config: { selfClosing: true } },

  // Table
  table: { tag: 'table' },
  tbody: { tag: 'tbody' },
  tr: { tag: 'tr' },
  td: { tag: 'td' },
  th: { tag: 'th' },

  // Root wrapper
  richText: { tag: 'div', config: { className: 'cms:rich-text' } },
} as const;

/**
 * Available types for generic elements that don't need special properties
 * Derived from defaultElementTypeMap, excluding elements with specialized interfaces
 */
export type GenericElementType = Exclude<
  keyof typeof defaultElementTypeMap,
  'link' | 'image' | 'td' | 'th'
>;

/**
 * Default text mark mapping
 */
export const defaultMarkTypeMap: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strikethrough: 's',
  code: 'code',
};
