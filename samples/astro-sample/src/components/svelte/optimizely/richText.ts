import {
  defaultElementTypeMap,
  getImageAttributes,
  splitAttributes,
  type ImageElement,
  type RenderNode,
} from '@optimizely/cms-sdk/core';

const toKebabCase = (property: string) =>
  property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

const toStyleString = (style: Record<string, string>) =>
  Object.entries(style)
    .map(([property, value]) => `${toKebabCase(property)}: ${value}`)
    .join('; ') || undefined;

// The render tree has already mapped `url` to `src`; the preview token is applied on top.
const withPreviewToken = (attributes: Record<string, unknown>) => ({
  ...attributes,
  ...getImageAttributes({ ...attributes, url: attributes.src } as ImageElement),
});

/** The HTML tag and attributes for a rich-text element node. */
export function toElementProps(node: RenderNode) {
  const elementType = node.elementType ?? '';
  const tag = defaultElementTypeMap[elementType]?.tag ?? 'div';
  const source = node.attributes ?? {};

  const { attributes, style } = splitAttributes(
    elementType === 'image' ? withPreviewToken(source) : source,
    tag,
  );

  return { tag, attributes: { ...attributes, style: toStyleString(style) } };
}
