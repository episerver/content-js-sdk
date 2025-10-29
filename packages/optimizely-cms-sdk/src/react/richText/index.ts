export { RichText } from './component.js';
export {
  generateDefaultElements,
  generateDefaultLeafs,
  createHtmlComponent,
  createLeafComponent,
  createLinkComponent,
  createImageComponent,
  createTableComponent,
  createTableCellComponent,
} from './lib.js';

export type {
  ElementProps,
  LeafProps,
  ElementRendererProps,
  LinkElementProps,
  ImageElementProps,
  TableElementProps,
  TableCellElementRendererProps,
  ElementMap,
  LeafMap,
  RichTextProps,
} from './lib.js';

export type {
  Node,
  Element,
  Text,
  LinkElement,
  ImageElement,
  TableElement,
  TableCellElement,
  GenericElement,
  GenericElementType,
  BaseElement,
  ElementType,
  MarkType,
} from '../../components/richText/renderer.js';
