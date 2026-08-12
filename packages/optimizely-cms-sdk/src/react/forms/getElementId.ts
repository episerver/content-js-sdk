/**
 * Extracts the element ID from form content.
 * Tries composition key first (for CMS-rendered nodes), then fallback to _id.
 */
export function getElementId(content: Record<string, unknown> | undefined): string | undefined {
  if (!content) return undefined;
  const id = (content as any)?.__composition?.key || (content as any)?._id;
  return typeof id === 'string' ? id : undefined;
}
