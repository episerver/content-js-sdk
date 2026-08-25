import { getClient } from '../../graph/index.js';

type FormContainerLike = {
  nodes?: unknown;
  _metadata?: {
    key?: string | null;
    locale?: string | null;
    version?: string | null;
  } | null;
  __context?: {
    preview_token?: string;
  } | null;
};

/**
 * Reads a form container's steps, fetching them when the response left them out.
 *
 * Graph only resolves a section's `composition` when that section is asked for
 * directly. Reached through a content area, the container arrives as a nested
 * document with `composition` empty, so a form placed in a content area would
 * render as a title with no fields. There is no `_ContentWhereInput` field to
 * ask for it in the page's own query, so this fetches the container on its own.
 *
 * Costs one extra Graph request, and only for a form in a content area. A form
 * in an experience composition already arrives whole and is returned as is.
 *
 * @example
 * ```tsx
 * export default async function FormContainer({ content }) {
 *   const nodes = await getFormNodes(content);
 *   // ...
 * }
 * ```
 */
export async function getFormNodes<T = any>(content: FormContainerLike): Promise<T[]> {
  if (Array.isArray(content?.nodes) && content.nodes.length > 0) {
    return content.nodes as T[];
  }

  const key = content?._metadata?.key;
  if (!key) return [];

  const previewToken = content.__context?.preview_token;

  // A version pins the draft being previewed; without one Graph returns the
  // published container, which is the wrong content behind a preview token.
  const version = content._metadata?.version ?? undefined;
  const locale = content._metadata?.locale ?? undefined;

  const container = await getClient().getContent(
    { key, ...(version ? { version } : locale ? { locale } : {}) },
    previewToken ? { previewToken } : undefined,
  );

  return ((container as { nodes?: T[] } | null)?.nodes ?? []) as T[];
}
