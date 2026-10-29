/**
 * Refreshes the preview by patching the rendered content in place, for hosts
 * without a client-side router.
 *
 * @module
 */
import { normalizePathname, stripToken } from '../../util/preview.js';
import type { NavigateCallback } from './contentSaved.js';

export type RefreshInPlaceOptions = {
  /**
   * Selector for the element wrapping the rendered content. It is looked up in
   * both the current page and the freshly rendered one.
   * @default '[data-optimizely-preview-root]'
   */
  root?: string;
};

const mediaAttributes = (root: Element) =>
  [...root.querySelectorAll('img, source')].flatMap(element =>
    ['src', 'srcset'].flatMap(name => {
      const value = element.getAttribute(name);
      return value ? [{ element, name, value, key: `${name} ${stripToken(value)}` }] : [];
    }),
  );

/** Media URLs carry the preview token, which changes on every save. */
const reuseMediaUrls = (current: Element, next: Element) => {
  const liveValues = new Map(mediaAttributes(current).map(it => [it.key, it.value]));

  mediaAttributes(next).forEach(({ element, name, key }) => {
    const liveValue = liveValues.get(key);
    if (liveValue) element.setAttribute(name, liveValue);
  });
};

const sameShell = (node: Node, nextNode: Node) =>
  node instanceof Element &&
  nextNode instanceof Element &&
  node.cloneNode(false).isEqualNode(nextNode.cloneNode(false));

const isIsland = (node: Node): node is Element =>
  node instanceof Element && node.localName === 'astro-island';

const sameComponent = (island: Element, nextIsland: Element) =>
  ['component-url', 'component-export'].every(
    name => island.getAttribute(name) === nextIsland.getAttribute(name),
  );

/** Astro unmounts removed islands only after its own page swaps, so it never happens here. */
const unmountIslands = (node: Node) => {
  if (!(node instanceof Element)) return;
  [node, ...node.querySelectorAll('astro-island')]
    .filter(isIsland)
    .forEach(it => it.dispatchEvent(new CustomEvent('astro:unmount')));
};

/** `props` is observed: Astro re-renders the live island with it and keeps its state. */
const patchIsland = (island: Element, nextIsland: Element) => {
  const props = nextIsland.getAttribute('props') ?? '';
  if (island.getAttribute('props') !== props) island.setAttribute('props', props);
};

const patchNode = (node: ChildNode, nextNode: ChildNode) => {
  if (node.isEqualNode(nextNode)) return;
  // Hydrating rewrites an island's own attributes, so it never equals a fresh render
  if (isIsland(node) && isIsland(nextNode) && sameComponent(node, nextNode))
    return patchIsland(node, nextNode);
  if (sameShell(node, nextNode)) return patchChildren(node, nextNode);
  node.replaceWith(nextNode);
  unmountIslands(node);
};

/** Positional diff: unchanged nodes stay in the DOM, so images and island state survive. */
const patchChildren = (current: Node, next: Node) => {
  const nextNodes = [...next.childNodes];

  [...current.childNodes].slice(nextNodes.length).forEach(it => {
    it.remove();
    unmountIslands(it);
  });
  nextNodes.forEach((nextNode, index) => {
    const node = current.childNodes[index];
    if (node) patchNode(node, nextNode);
    else current.appendChild(nextNode);
  });
};

const fetchDocument = async (url: URL, signal: AbortSignal) => {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Preview refresh failed with ${response.status}`);
  return new DOMParser().parseFromString(await response.text(), 'text/html');
};

const isSamePage = (target: URL) =>
  normalizePathname(target.pathname) === normalizePathname(window.location.pathname);

// Module-level so callers can create the callback inline on every render
let inFlight: AbortController | undefined;

/**
 * Creates an `onNavigate` callback that fetches the new preview URL and patches
 * the root element with its content, keeping nodes that did not change.
 *
 * Falls back to a full reload when the root is missing, the target is another
 * page, or the request fails.
 */
export function refreshInPlace({
  root = '[data-optimizely-preview-root]',
}: RefreshInPlaceOptions = {}): NavigateCallback {
  return async url => {
    const reload = () => window.location.replace(url);
    const target = new URL(url, window.location.href);
    const current = document.querySelector(root);
    if (!current || !isSamePage(target)) return reload();

    // A slow response for an earlier save must not overwrite a newer one
    inFlight?.abort();
    inFlight = new AbortController();
    const { signal } = inFlight;

    try {
      // Same origin as the page, in case the CMS reports a different host for it
      const path = target.pathname + target.search;
      const nextUrl = new URL(path, window.location.origin);
      const next = (await fetchDocument(nextUrl, signal)).querySelector(root);
      if (!next) return reload();

      reuseMediaUrls(current, next);
      patchChildren(current, next);
      // A manual reload then uses the latest preview token
      window.history.replaceState(window.history.state, '', path);
    } catch {
      if (!signal.aborted) reload();
    }
  };
}
