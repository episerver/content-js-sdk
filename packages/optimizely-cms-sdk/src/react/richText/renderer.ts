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
    // Use span as fallback for inline elements to avoid hydration errors with block elements in paragraphs
    const inlineElements = [
      'span',
      'mark',
      'strong',
      'em',
      'u',
      's',
      'code',
      'i',
      'b',
    ];
    const fallbackTag = inlineElements.includes(elementType)
      ? 'span'
      : (this.getConfig('elementFallback', 'div') as string);

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
