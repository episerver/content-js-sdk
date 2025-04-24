import type { AnyContentType } from './contentTypes.js';

type NodeType = 'row' | 'colunm';

type EditorType = 'select' | 'checkbox';

type BaseType = AnyContentType['baseType'];

type NodeTemplate = {
  nodeType: NodeType;
  baseType?: never;
  contentType?: never;
};

type BaseTemplate = {
  baseType: BaseType;
  contentType?: never;
  nodeType?: never;
};

type WithContentType = {
  contentType: string;
  baseType?: never;
  nodeType?: never;
};

type ChoiceType = Record<
  string,
  {
    displayName: string;
    sortOrder: number;
  }
>;

type SettingsType = Record<
  string,
  {
    displayName: string;
    editor: EditorType;
    sortOrder: number;
    choices: ChoiceType;
  }
>;

type BaseDisplayTemplate = {
  key: string;
  displayName: string;
  isDefault: boolean;
  settings: SettingsType;
};

export type DisplayTemplate = BaseDisplayTemplate &
  (NodeTemplate | BaseTemplate | WithContentType);
