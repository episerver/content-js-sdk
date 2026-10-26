const sameShell = (node: Node, nextNode: Node) =>
  node instanceof Element &&
  nextNode instanceof Element &&
  node.cloneNode(false).isEqualNode(nextNode.cloneNode(false));

const patchNode = (node: ChildNode, nextNode: ChildNode) => {
  if (node.isEqualNode(nextNode)) return;
  if (sameShell(node, nextNode)) return patchChildren(node, nextNode);
  node.replaceWith(nextNode);
};

/** Updates the children of `current` to match `next`, keeping nodes that are unchanged. */
export function patchChildren(current: Node, next: Node) {
  const nextNodes = [...next.childNodes];

  [...current.childNodes].slice(nextNodes.length).forEach(it => it.remove());
  nextNodes.forEach((nextNode, index) => {
    const node = current.childNodes[index];
    if (node) patchNode(node, nextNode);
    else current.appendChild(nextNode);
  });
}
