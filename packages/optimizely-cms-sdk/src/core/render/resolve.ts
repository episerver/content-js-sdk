/**
 * Turns a piece of CMS content into everything a framework needs to render it:
 * which component to use, with which props, and which preview attributes belong
 * on a wrapper.
 *
 * Pure — no framework, no DOM.
 *
 * @module
 */

import { getDisplayTemplateTag } from '../../model/displayTemplateRegistry.js';
import type { ExperienceCompositionNode } from '../../infer.js';
import type { ComponentRegistry } from '../../render/componentRegistry.js';
import { resolveComponent, type ResolveComponentOptions } from './registry.js';

/** Content data from the CMS, as the render layer reads it. */
export type OptimizelyContent = {
  /** Content type name */
  __typename: string;

  /** Display template tag (if any) */
  __tag?: string;

  displayTemplateKey?: string | null;

  /** Preview context */
  __context?: { edit: boolean; preview_token: string };

  __composition?: ExperienceCompositionNode;

  composition?: ExperienceCompositionNode;

  /** metadata */
  _metadata?: {
    types?: string[];
    displayOption?: string | null;
  };
};

export type ResolvedContentComponent<C> = {
  /** The component to render, or `undefined` when nothing is registered for it. */
  component: C | undefined;

  /** The content type the lookup finally matched, for the fallback message. */
  typename: string | undefined;

  /** The tag the lookup used. */
  tag: string | undefined;

  /** The content to hand the component, with {@linkcode OptimizelyContent.__tag} applied. */
  contentProps: Record<string, unknown>;

  /** Caller props, minus the preview attributes. */
  componentProps: Record<string, unknown>;

  /** `data-epi-*` props. Always empty outside edit mode. */
  previewAttrs: Record<string, unknown>;
};

/** Gets the display template key from content, checking multiple sources. */
function getDisplayTemplateKey(content: OptimizelyContent): string | null | undefined {
  return (
    content._metadata?.displayOption ??
    content.composition?.displayTemplateKey ??
    content.__composition?.displayTemplateKey ??
    content.displayTemplateKey
  );
}

/**
 * Resolves the tag to use for component lookup.
 * Checks tag override first, then falls back to content.__tag or display template tag.
 */
export function resolveTag(
  content: OptimizelyContent,
  componentTag?: string,
): string | undefined {
  //  tag override priority for tag provided by caller (e.g. OptimizelyComponent's `tag` prop)
  if (componentTag) {
    return componentTag;
  }

  // Fall back to content tag or display template tag or displayOption
  const displayTemplateKey = getDisplayTemplateKey(content);
  return content.__tag ?? getDisplayTemplateTag(displayTemplateKey);
}

/**
 * Finds a component by trying each type in `_metadata.types`, falling back to `__typename`.
 * Returns both the matched component and the typename that resolved.
 */
function findComponent<C>(
  content: OptimizelyContent,
  options: ResolveComponentOptions<C>,
): { component: C | undefined; typename: string | undefined } {
  // Try _metadata.types array first
  const types = content._metadata?.types;
  if (Array.isArray(types)) {
    for (const typename of types) {
      const component = resolveComponent<C>(typename, options);
      if (component) return { component, typename };
    }
  }

  // Fallback to __typename
  const typename = content.__typename;
  const component = typename ? resolveComponent<C>(typename, options) : undefined;
  return { component, typename };
}

/** Splits caller props into preview attributes and everything else. */
export function splitPreviewAttrs(
  props: Record<string, unknown>,
  isEditMode: boolean,
): { previewAttrs: Record<string, unknown>; componentProps: Record<string, unknown> } {
  const previewAttrs: Record<string, unknown> = {};
  const componentProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('data-epi-')) {
      previewAttrs[key] = value;
    } else {
      componentProps[key] = value;
    }
  }

  // Outside edit mode the attributes are never rendered, so the caller should not
  // have to decide whether wrapping is worth it.
  return { previewAttrs: isEditMode ? previewAttrs : {}, componentProps };
}

/**
 * Resolves the component and props for one piece of content.
 *
 * @param content Content read from the CMS.
 * @param options.tag Manual tag override, taking priority over the content's own.
 * @param options.props Extra props from the caller. `data-epi-*` entries are separated out.
 * @param options.registry Looked up instead of the global registries.
 */
export function resolveContentComponent<C>(
  content: OptimizelyContent,
  options: {
    tag?: string;
    props?: Record<string, unknown>;
    registry?: ComponentRegistry<C>;
  } = {},
): ResolvedContentComponent<C> {
  const tag = resolveTag(content, options.tag);
  const { component, typename } = findComponent<C>(content, {
    tag,
    registry: options.registry,
  });

  const { previewAttrs, componentProps } = splitPreviewAttrs(
    options.props ?? {},
    !!content.__context?.edit,
  );

  return {
    component,
    typename,
    tag,
    contentProps: { ...content },
    componentProps,
    previewAttrs,
  };
}
