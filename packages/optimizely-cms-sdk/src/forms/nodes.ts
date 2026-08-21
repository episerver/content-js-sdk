import type { ExperienceComponentNode, ExperienceNode } from '../infer.js';

/** Content type key of the element Optimizely Forms uses for every form button. */
const SUBMIT_ELEMENT_TYPE = 'OptiFormsSubmitElement';

/**
 * Returns true for a composition node holding a form button.
 *
 * A node's own `__typename` is always `CompositionStructureNode` or
 * `CompositionComponentNode`, never a content type key, so the type has to be
 * read off the component the node wraps.
 */
export const isFormButtonNode = (node: ExperienceNode): boolean =>
  node.nodeType === 'component' &&
  (node as ExperienceComponentNode).component?.__typename === SUBMIT_ELEMENT_TYPE;

/**
 * Separates a form's buttons from the rest of its composition, at any depth.
 *
 * Editors place Next, Previous and Submit wherever they like — often each in its
 * own row, which stacks them and stretches them to the width of their column.
 * Pulling them out lets a template lay them out as one footer regardless of how
 * the form was authored. Rows and columns left empty afterwards are dropped, so
 * they don't render as blank gaps.
 *
 * @returns `content` with the buttons removed, and the `buttons` in the order
 *   they were authored.
 */
export function partitionFormNodes(nodes: ExperienceNode[]): {
  content: ExperienceNode[];
  buttons: ExperienceNode[];
} {
  const content: ExperienceNode[] = [];
  const buttons: ExperienceNode[] = [];

  for (const node of nodes) {
    const childNodes = 'nodes' in node ? node.nodes : undefined;

    if (isFormButtonNode(node)) {
      buttons.push(node);
    } else if (Array.isArray(childNodes)) {
      const inner = partitionFormNodes(childNodes);
      buttons.push(...inner.buttons);
      if (inner.content.length > 0) content.push({ ...node, nodes: inner.content });
    } else {
      content.push(node);
    }
  }

  return { content, buttons };
}
