import type { RenderNode } from './renderer.js';
import { buildRenderTree } from './renderer.js';
import type { Node, RendererConfig } from './renderer.js';

/**
 * Configuration for framework adapters
 */
export interface AdapterConfig extends RendererConfig {
  elementMap?: Record<string, unknown>;
  markMap?: Record<string, unknown>;
  elementFallback?: string;
  markFallback?: string;
}

/**
 * Framework adapter interface that any UI framework can implement
 */
export interface FrameworkAdapter<T = unknown> {
  readonly name: string;

  /**
   * Convert a single RenderNode to a framework-specific element
   */
  renderNode(node: RenderNode, config: AdapterConfig): T;

  /**
   * Convert an array of RenderNodes to framework-specific elements
   */
  renderNodes(nodes: RenderNode[], config: AdapterConfig): T[];

  /**
   * Create a text element with optional marks
   */
  createTextElement(content: string, marks: string[], config: AdapterConfig): T;

  /**
   * Create a container element with children
   */
  createElement(
    type: string,
    attributes: Record<string, unknown>,
    children: T[],
    config: AdapterConfig
  ): T;

  /**
   * Wrap an element with a mark (bold, italic, etc.)
   */
  wrapWithMark(element: T, mark: string, config: AdapterConfig): T;
}

/**
 * Universal rich text renderer that works with any framework adapter
 */
export class UniversalRichTextRenderer<T = unknown> {
  private adapter: FrameworkAdapter<T>;

  constructor(adapter: FrameworkAdapter<T>) {
    this.adapter = adapter;
  }

  /**
   * Render Slate JSON content using the configured adapter
   */
  render(content: Node[], config: AdapterConfig = {}): T[] {
    // Convert Slate JSON to framework-agnostic render tree
    const renderTree = buildRenderTree(content, config);

    // Use adapter to convert to framework-specific elements
    return this.adapter.renderNodes(renderTree, config);
  }

  /**
   * Get the adapter name
   */
  getAdapterName(): string {
    return this.adapter.name;
  }
}

/**
 * Factory function to create framework-specific renderers
 */
export function createRenderer<T>(
  adapter: FrameworkAdapter<T>
): UniversalRichTextRenderer<T> {
  return new UniversalRichTextRenderer(adapter);
}

/**
 * Helper for implementing framework adapters
 */
export abstract class BaseFrameworkAdapter<T> implements FrameworkAdapter<T> {
  abstract readonly name: string;

  renderNodes(nodes: RenderNode[], config: AdapterConfig): T[] {
    return nodes.map((node) => this.renderNode(node, config));
  }

  renderNode(node: RenderNode, config: AdapterConfig): T {
    if (node.type === 'text') {
      return this.createTextElement(
        node.content || '',
        node.marks || [],
        config
      );
    } else {
      const children = node.children
        ? this.renderNodes(node.children, config)
        : [];

      return this.createElement(
        node.elementType!,
        node.attributes || {},
        children,
        config
      );
    }
  }

  abstract createTextElement(
    content: string,
    marks: string[],
    config: AdapterConfig
  ): T;

  abstract createElement(
    type: string,
    attributes: Record<string, unknown>,
    children: T[],
    config: AdapterConfig
  ): T;

  abstract wrapWithMark(element: T, mark: string, config: AdapterConfig): T;
}
