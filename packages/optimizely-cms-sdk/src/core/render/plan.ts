/**
 * Walks an experience composition and produces a flat description of what to
 * render, without producing any framework's elements.
 *
 * A framework binding maps the returned items onto its own element type; all the
 * decisions — which tag applies, how a node's fields become component content,
 * which preview attributes go where — are made here.
 *
 * @module
 */

import type { ExperienceNode } from '../../infer.js';
import { isComponentNode } from '../../util/baseTypeUtil.js';
import { parseDisplaySettings } from '../../model/displayTemplates.js';
import { getDisplayTemplateTag } from '../../model/displayTemplateRegistry.js';
import { getPreviewUtils } from '../preview/attributes.js';
import type { ComponentRegistry } from '../../render/componentRegistry.js';
import { resolveComponent } from './registry.js';
import type { OptimizelyContent } from './resolve.js';

/** Display settings after parsing, as a component receives them. */
export type ParsedDisplaySettings = Record<string, string | boolean> | undefined;

type RenderItemBase = {
  key: string;
  node: ExperienceNode;
  /** The node's display-template tag, already applied to `content` as `__tag`. */
  tag: string | undefined;
  displaySettings: ParsedDisplaySettings;
  /** `data-epi-*` attributes for this node. Empty outside edit mode. */
  previewAttrs: Record<string, unknown>;
};

/** A node holding a component. The binding renders `content` through its component lookup. */
export type ComponentRenderItem = RenderItemBase & {
  kind: 'component';
  content: OptimizelyContent & Record<string, unknown>;
  /**
   * Which kind of node produced this item.
   *
   * A section is a content type in its own right, so it renders as content
   * directly; a component node is what a binding offers a wrapper around.
   */
  source: 'component' | 'section';
};

/**
 * A structure node — a row, a column, a form step — that wraps other items.
 *
 * `globalComponent` is whatever the registry holds for the node type (`_Row`,
 * `_Column`). A binding is free to prefer its own override and to fall back to
 * something of its own when both are absent.
 */
export type StructureRenderItem<C> = RenderItemBase & {
  kind: 'structure';
  nodeType: string;
  index: number;
  globalComponent: C | undefined;
  children: GridRenderItem<C>[];
};

/** A node whose content type the CMS did not resolve. */
export type UnknownRenderItem = RenderItemBase & {
  kind: 'unknown';
};

/** What {@linkcode planGridSection} produces, at every depth. */
export type GridRenderItem<C> = ComponentRenderItem | StructureRenderItem<C>;

export type RenderItem<C> = GridRenderItem<C> | UnknownRenderItem;

/** Whether the item is a component node, which a binding renders inside a wrapper carrying its preview attributes. */
export function isWrappedComponent<C>(
  item: RenderItem<C>,
): item is ComponentRenderItem & { source: 'component' } {
  return item.kind === 'component' && item.source === 'component';
}

/** Picks the container for a structure item: the binding's override, then the registered `_Row`/`_Column`, then the binding's fallback. */
export function getStructureContainer<C>(
  item: StructureRenderItem<C>,
  {
    overrides = {},
    fallbacks = {},
  }: {
    overrides?: Partial<Record<string, C>>;
    fallbacks?: Partial<Record<string, C>>;
  } = {},
): C | undefined {
  return overrides[item.nodeType] ?? item.globalComponent ?? fallbacks[item.nodeType];
}

/** The registry keys used for globally registered row and column components. */
const GLOBAL_STRUCTURE_NAMES: Record<string, string> = {
  row: '_Row',
  column: '_Column',
};

/** The per-node values every branch below needs. */
function readNode(node: ExperienceNode) {
  const { pa } = getPreviewUtils(node);

  return {
    key: node.key,
    node,
    tag: getDisplayTemplateTag(node.displayTemplateKey),
    displaySettings: parseDisplaySettings(node.displaySettings),
    previewAttrs: pa(node),
  };
}

/**
 * Plans a flat composition, as rendered inside an experience section.
 *
 * Component nodes are expected to be wrapped by the binding, which is why their
 * `previewAttrs` are reported separately rather than folded into `content`.
 * Structure nodes are rendered as content in their own right here — a section has
 * its own content type and its own component.
 */
export function planComposition(
  nodes: ExperienceNode[],
): (ComponentRenderItem | UnknownRenderItem)[] {
  return nodes.map(node => {
    const base = readNode(node);

    if (isComponentNode(node)) {
      return {
        ...base,
        kind: 'component',
        source: 'component',
        content: { ...node.component, __tag: base.tag },
      };
    }

    if (node.type === null) {
      return { ...base, kind: 'unknown' };
    }

    // A section node carries user-defined properties in `component`, and its own
    // scalar fields have to reach the component too.
    const componentData = 'component' in node ? (node.component as object) : {};

    return {
      ...base,
      kind: 'component',
      source: 'section',
      content: {
        ...componentData,
        ...node,
        __typename: node.type,
        __tag: base.tag,
      },
    };
  });
}

/**
 * Plans a grid section, recursing through rows and columns.
 *
 * Unlike {@linkcode planComposition}, a component node keeps a reference to the
 * node it came from under `__composition`, which is what lets a component read
 * its own display template key and its composition key.
 *
 * @param options.registry Looked up for `_Row` / `_Column` instead of the global registries.
 */
export function planGridSection<C>(
  nodes: ExperienceNode[],
  options: { registry?: ComponentRegistry<C> } = {},
): GridRenderItem<C>[] {
  return nodes.map((node, index) => {
    const base = readNode(node);

    if (isComponentNode(node)) {
      return {
        ...base,
        kind: 'component',
        source: 'component',
        content: {
          // `node.component` contains user-defined properties
          ...node.component,
          __composition: node,
          __tag: base.tag,
        },
      };
    }

    const { nodeType } = node;
    const globalName = GLOBAL_STRUCTURE_NAMES[nodeType];

    return {
      ...base,
      kind: 'structure',
      nodeType,
      index,
      // Lazy, so the registry isn't consulted when the binding has its own override
      get globalComponent() {
        return globalName ?
            resolveComponent<C>(globalName, { tag: base.tag, registry: options.registry })
          : undefined;
      },
      children: planGridSection<C>(node.nodes ?? [], options),
    };
  });
}
