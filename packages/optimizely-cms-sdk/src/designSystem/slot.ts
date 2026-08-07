/**
 * Reserved content type marking a place where an editor can drop components —
 * an empty content area, an empty column, or the tail of a content list.
 *
 * The design-system viewer emits these inside generated sample content.
 * `OptimizelyComponent` recognises the key and renders a dashed placeholder
 * instead of looking it up in the component registry, so the affordance shows
 * up through the app's own rendering (content areas, compositions, grid
 * sections) without the app registering or knowing anything.
 *
 * ponytail: a reserved key beats a parallel "preview renderer" — one branch in
 * `OptimizelyComponent` covers every path content flows through.
 */
export const DESIGN_SYSTEM_SLOT = '_DesignSystemSlot';

/**
 * What a placeholder stands for:
 * - `area` — space to drop components into (dashed box).
 * - `caption` — names the structure node it sits in (small chip). Rows and
 *   columns are the app's own markup, so a caption inside them is the only way
 *   to say which is which without the app cooperating.
 */
export type SlotKind = 'area' | 'caption';

/** Sample-content stand-in for an empty, fillable area or a structure caption. */
export type DesignSystemSlot = {
  __typename: typeof DESIGN_SYSTEM_SLOT;
  _metadata: { types: string[] };
  /** Text rendered inside the placeholder. */
  _slotLabel: string;
  _slotKind: SlotKind;
  /**
   * Node type a caption belongs to. Rendered as `data-ods-caption`, which the
   * viewer's stylesheet keys off to outline the app's own row and column
   * elements — they are the caption's parent, and `:has()` can reach them
   * without the app marking anything up.
   */
  _slotNode?: string;
};

/** Builds a slot placeholder for use anywhere sample content is rendered. */
export function slotContent(
  label = 'Drop components here',
  kind: SlotKind = 'area',
): DesignSystemSlot {
  return {
    __typename: DESIGN_SYSTEM_SLOT,
    _metadata: { types: [DESIGN_SYSTEM_SLOT] },
    _slotLabel: label,
    _slotKind: kind,
  };
}

/**
 * Caption chip naming the structure node it is rendered inside.
 *
 * @param label Text of the chip.
 * @param nodeType Node the caption sits in (`row`, `column`).
 */
export function captionContent(label: string, nodeType: string): DesignSystemSlot {
  return { ...slotContent(label, 'caption'), _slotNode: nodeType };
}
