/** Identifiers an element can be known by, most specific first. */
const idCandidates = (content: Record<string, unknown>): unknown[] => [
  (content as any)?.__composition?.key,
  (content as any)?._metadata?.key,
  (content as any)?._id,
];

/**
 * Every identifier a dependency rule might use to name this element.
 */
export function getElementIds(content: Record<string, unknown> | undefined): string[] {
  if (!content) return [];

  const ids = idCandidates(content).filter(
    (id): id is string => typeof id === 'string' && id.length > 0,
  );

  return [...new Set(ids)];
}

/**
 * Extracts the element ID from form content.
 * Tries composition key first (for CMS-rendered nodes), then the content key.
 */
export function getElementId(
  content: Record<string, unknown> | undefined,
): string | undefined {
  return getElementIds(content)[0];
}
