import React, { type ReactNode } from 'react';
import {
  BaseRichTextRenderer,
  type BaseRendererConfig,
} from '../../components/richText/base.js';
import {
  type RenderNode,
  type Node,
  type Element,
  createElementData,
} from '../../components/richText/renderer.js';
import {
  generateDefaultElements,
  generateDefaultLeafs,
  type ElementRenderer,
  type LeafRenderer,
  type ElementMap,
  type LeafMap,
} from './lib.js';

/**
 * React-specific renderer configuration
 */
export interface ReactRendererConfig extends BaseRendererConfig {
  elements?: ElementMap;
  leafs?: LeafMap;
}

/**
 * React implementation of the rich text renderer using the base class
 */
export class ReactRichTextRenderer extends BaseRichTextRenderer<
  ElementRenderer,
  LeafRenderer,
  ReactNode
> {
  private elements: ElementMap;
  private leafs: LeafMap;

  constructor(config: Partial<ReactRendererConfig> = {}) {
    super(config);

    // Convert custom element keys to lowercase for consistent lookup
    const lowercaseElements = config.elements
      ? Object.fromEntries(
          Object.entries(config.elements).map(([key, value]) => [
            key.toLowerCase(),
            value,
          ])
        )
      : {};

    this.elements = {
      ...generateDefaultElements(),
      ...lowercaseElements,
    };

    // Convert custom leaf keys to lowercase for consistent lookup
    const lowercaseLeafs = config.leafs
      ? Object.fromEntries(
          Object.entries(config.leafs).map(([key, value]) => [
            key.toLowerCase(),
            value,
          ])
        )
      : {};

    this.leafs = {
      ...generateDefaultLeafs(),
      ...lowercaseLeafs,
    };
  }

  /**
   * Render Slate JSON content to React nodes
   */
  render(content: Node[]): ReactNode[] {
    const renderTree = this.buildRenderTree(content); // Using base class method
    return this.renderNodes(renderTree);
  }

  /**
   * Create a React element from a render node
   */
  protected createElement(
    node: RenderNode,
    children: ReactNode[],
    index: number
  ): ReactNode {
    // Normalize element type to lowercase for consistent lookup
    const normalizedElementType = node.elementType!.toLowerCase();

    const ElementComponent =
      this.elements[normalizedElementType] ||
      this.getDefaultElement(normalizedElementType);

    const elementData = createElementData(
      normalizedElementType,
      node.attributes
    );

    // Extract text content from render nodes
    const textContent = node.children
      ? this.extractTextFromRenderNodes(node.children)
      : '';

    // Create the React element with enhanced props
    return React.createElement(
      ElementComponent,
      {
        element: elementData,
        attributes: node.attributes,
        text: textContent,
        key: `element-${normalizedElementType}-${index}`, // Unique key for each element
      },
      ...children
    );
  }

  /**
   * Create a React text node with marks
   */
  protected createTextNode(node: RenderNode, index: number): ReactNode {
    const decodedText = this.decodeEntities(node.content || ''); // Using base class method

    // If no marks, return plain text
    if (!node.marks || node.marks.length === 0) {
      return decodedText;
    }

    // Start with plain text for marked content
    let element: ReactNode = decodedText;

    // Apply marks by wrapping with leaf components
    for (let markIndex = 0; markIndex < node.marks.length; markIndex++) {
      const mark = node.marks[markIndex];
      // Normalize mark to lowercase for consistent lookup
      const normalizedMark = mark.toLowerCase();
      const LeafComponent =
        this.leafs[normalizedMark] || this.getDefaultLeaf(normalizedMark);

      // Create leaf data
      const leafData = {
        text: decodedText,
        [mark]: true, // Keep original mark name in the data
      };

      element = React.createElement(
        LeafComponent,
        {
          leaf: leafData,
          attributes: {},
          text: decodedText,
          key: `leaf-${normalizedMark}-${index}-${markIndex}`, // Use normalized mark for key
        },
        element
      );
    }

    return element;
  }

  /**
   * Extract text content from render nodes recursively
   */
  private extractTextFromRenderNodes(nodes: RenderNode[]): string {
    return nodes
      .map((node) => {
        if (node.type === 'text') {
          return this.decodeEntities(node.content || '');
        } else if (node.children) {
          return this.extractTextFromRenderNodes(node.children);
        }
        return '';
      })
      .join('');
  }

  /**
   * Get default element component for unknown types
   */
  private getDefaultElement(elementType: string): ElementRenderer {
    // Comprehensive list of inline elements that can safely be rendered inside paragraphs
    const inlineElements = [
      // Text formatting
      'span',
      'mark',
      'strong',
      'em',
      'u',
      's',
      'code',
      'i',
      'b',
      'small',
      'sub',
      'sup',
      'ins',
      'del',
      'kbd',
      'var',
      'samp',

      // Interactive elements
      'a',
      'button',
      'label',

      // Media (when inline)
      'img',
      'svg',
      'canvas',

      // Form elements
      'input',
      'select',
      'textarea',

      // Other inline elements
      'br',
      'wbr',
      'time',
      'data',
      'abbr',
      'cite',
      'dfn',
      'q',
    ];

    // Block elements that should never be inside paragraphs
    const blockElements = [
      // Structural
      'div',
      'section',
      'article',
      'aside',
      'nav',
      'main',
      'header',
      'footer',

      // Headings
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'heading-one',
      'heading-two',
      'heading-three',
      'heading-four',
      'heading-five',
      'heading-six',

      // Content blocks
      'p',
      'paragraph',
      'blockquote',
      'quote',
      'pre',
      'address',

      // Lists
      'ul',
      'ol',
      'li',
      'dl',
      'dt',
      'dd',
      'bulleted-list',
      'numbered-list',
      'list-item',

      // Tables
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'td',
      'th',

      // Forms
      'form',
      'fieldset',
      'legend',

      // Media blocks
      'figure',
      'figcaption',
      'video',
      'audio',

      // Other blocks
      'hr',
      'details',
      'summary',
    ];

    // Determine the appropriate fallback
    let fallbackTag: string;

    if (inlineElements.includes(elementType)) {
      fallbackTag = 'span';
    } else if (blockElements.includes(elementType)) {
      fallbackTag = this.getConfig('elementFallback', 'div') as string;
    } else {
      // For unknown elements, use safeInlineFallback setting
      const useSafeFallback = this.getConfig('safeInlineFallback', true);
      fallbackTag = useSafeFallback
        ? 'span' // Safe default to prevent hydration errors
        : (this.getConfig('elementFallback', 'div') as string);
    }

    return ({ children }) => {
      return React.createElement(fallbackTag, {}, children);
    };
  }

  /**
   * Get default leaf component for unknown marks
   */
  private getDefaultLeaf(mark: string): LeafRenderer {
    const fallbackTag = this.getConfig('leafFallback', 'span') as string;

    return ({ children }) => {
      return React.createElement(fallbackTag, {}, children);
    };
  }
}

/**
 * Factory function to create a React renderer
 */
export function createReactRenderer(
  config?: Partial<ReactRendererConfig>
): ReactRichTextRenderer {
  return new ReactRichTextRenderer(config);
}
