export { RichText } from './component.js';
export {
  generateDefaultElements,
  generateDefaultLeafs,
  createHtmlComponent,
  createLeafComponent,
} from './lib.js';
export type {
  ElementRendererProps,
  LeafRendererProps,
  ElementMap,
  LeafMap,
} from './lib.js';

// Class-based renderer (alternative approach)
export { ReactRichTextRenderer, createReactRenderer } from './renderer.js';
export type { ReactRendererConfig } from './renderer.js';

// Re-export core types that React users might need
export type {
  Node,
  Element,
  Text,
  ElementType,
  MarkType,
} from '../../components/richText/renderer.js';
