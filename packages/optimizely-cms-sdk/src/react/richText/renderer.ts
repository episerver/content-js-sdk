import React, { type ReactNode } from 'react';
import {
  BaseRichTextRenderer,
  type BaseRendererConfig,
} from '../../components/richText/base.js';
import {
  type RenderNode,
  type Node,
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

    this.elements = {
      ...generateDefaultElements(),
      ...config.elements,
    };

    this.leafs = {
      ...generateDefaultLeafs(),
      ...config.leafs,
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
    const ElementComponent =
      this.elements[node.elementType!] ||
      this.getDefaultElement(node.elementType!);

    // Create the element data for the component
    const elementData = {
      type: node.elementType!,
      children: [],
      ...node.attributes,
    };

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
        key: `element-${node.elementType}-${index}`, // Unique key for each element
      },
      ...children
    );
  }

  /**
   * Create a React text node with marks
   */
  protected createTextNode(node: RenderNode, index: number): ReactNode {
    const decodedText = this.decodeEntities(node.content || ''); // Using base class method
    let element: ReactNode = React.createElement(
      'span',
      { key: `text-${index}` }, // unique key for text node
      decodedText
    );

    // Apply marks by wrapping with leaf components
    if (node.marks && node.marks.length > 0) {
      for (let markIndex = 0; markIndex < node.marks.length; markIndex++) {
        const mark = node.marks[markIndex];
        const LeafComponent = this.leafs[mark] || this.getDefaultLeaf(mark);

        // Create leaf data
        const leafData = {
          text: decodedText,
          [mark]: true,
        };

        const currentContent: ReactNode = React.isValidElement(element)
          ? (element.props as { children?: ReactNode }).children
          : element;

        element = React.createElement(
          LeafComponent,
          {
            leaf: leafData,
            attributes: {},
            text: decodedText,
            key: `leaf-${mark}-${index}-${markIndex}`, // Unique key for each leaf
          },
          currentContent
        );
      }
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
    const fallbackTag = this.getConfig('elementFallback', 'div') as string;

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
