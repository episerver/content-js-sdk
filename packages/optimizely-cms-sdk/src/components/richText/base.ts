import {
  buildRenderTree,
  decodeHTML,
  type Node,
  type RenderNode,
  type RendererConfig,
} from './renderer.js';

/**
 * Configuration for rich text renderers
 */
export interface BaseRendererConfig extends RendererConfig {}

/**
 * Base class for rich text renderers that provides common functionality
 * while allowing framework-specific implementations
 */
export abstract class BaseRichTextRenderer<
  TElement = unknown,
  TLeaf = unknown,
  TNode = unknown
> {
  protected config: BaseRendererConfig;

  constructor(config: Partial<BaseRendererConfig> = {}) {
    this.config = {
      decodeHtmlEntities: true,
      ...config,
    };
  }

  /**
   * Main render method - converts Slate JSON to framework-specific nodes
   */
  abstract render(content: Node[]): TNode[];

  /**
   * Framework-agnostic tree processing (shared across all implementations)
   */
  protected buildRenderTree(nodes: Node[]): RenderNode[] {
    return buildRenderTree(nodes, this.config);
  }

  /**
   * Framework-agnostic HTML entity decoding (shared across all implementations)
   */
  protected decodeEntities(text: string): string {
    return this.config.decodeHtmlEntities ? decodeHTML(text) : text;
  }

  /**
   * Get configuration value with fallback
   */
  protected getConfig<K extends keyof BaseRendererConfig>(
    key: K,
    fallback?: BaseRendererConfig[K]
  ): BaseRendererConfig[K] {
    return this.config[key] ?? fallback;
  }

  /**
   * Framework-specific element creation (must be implemented by each framework)
   */
  protected abstract createElement(
    node: RenderNode,
    children: TNode[],
    index: number
  ): TNode;

  /**
   * Framework-specific text node creation (must be implemented by each framework)
   */
  protected abstract createTextNode(node: RenderNode, index: number): TNode;

  /**
   * Common node processing logic - can be overridden if needed
   */
  protected renderNodes(nodes: RenderNode[]): TNode[] {
    return nodes.map((node, index) => this.renderNode(node, index));
  }

  /**
   * Common individual node rendering - can be overridden if needed
   */
  protected renderNode(node: RenderNode, index: number): TNode {
    if (node.type === 'text') {
      return this.createTextNode(node, index);
    } else {
      const children = node.children ? this.renderNodes(node.children) : [];
      return this.createElement(node, children, index);
    }
  }
}
