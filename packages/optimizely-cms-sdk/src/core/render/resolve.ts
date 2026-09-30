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

  /** `data-epi-*` props, or `undefined` when there are none. Always `undefined` outside edit mode. */
  previewAttrs: Record<string, unknown> | undefined;
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
  const lookup = (typename: string | undefined) => ({
    typename,
    component: typename ? resolveComponent<C>(typename, options) : undefined,
  });
  const types = content._metadata?.types ?? [];

  return types.map(lookup).find(it => it.component) ?? lookup(content.__typename);
}

/** Splits caller props into preview attributes and everything else. */
export function splitPreviewAttrs(
  props: Record<string, unknown>,
  isEditMode: boolean,
): {
  previewAttrs: Record<string, unknown> | undefined;
  componentProps: Record<string, unknown>;
} {
  const entries = Object.entries(props);
  const previewEntries = entries.filter(([key]) => key.startsWith('data-epi-'));
  const componentEntries = entries.filter(([key]) => !key.startsWith('data-epi-'));
  const hasPreviewAttrs = isEditMode && previewEntries.length > 0;

  return {
    previewAttrs: hasPreviewAttrs ? Object.fromEntries(previewEntries) : undefined,
    componentProps: Object.fromEntries(componentEntries),
  };
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
  options: ResolveComponentOptions<C> & { props?: Record<string, unknown> } = {},
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
