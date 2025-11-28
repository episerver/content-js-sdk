import { DisplaySettingsType, Infer } from '../infer.js';
import { BaseTypes } from './contentTypes.js';

// section node types
export const NODE_TYPES = ['row', 'column'] as const;

// cms editor types
export const EDITOR_TYPE = ['select', 'checkbox'] as const;

type NodeType = (typeof NODE_TYPES)[number];

type EditorType = (typeof EDITOR_TYPE)[number];

type NodeTemplate = {
  nodeType: NodeType;
  baseType?: never;
  contentType?: never;
};

type BaseTemplate = {
  baseType: BaseTypes | '_component';
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
  tag?: string; // Optional tag property to store the name of the React component
};

export type DisplayTemplateVariant = BaseDisplayTemplate &
  (NodeTemplate | BaseTemplate | WithContentType);

export type DisplayTemplate<T = DisplayTemplateVariant> = T & {
  __type: 'displayTemplate';
};


export function parseDisplaySettings(
  settings: DisplaySettingsType[] | null | undefined,
  templateSettings: Record<string, { editor: string; choices: Record<string, any> }>
): Record<string, string> {
  if (!settings || settings.length === 0) return {};

  const result: Record<string, string> = {};

  settings.forEach(s => {
    const settingDef = templateSettings[s.key];
    if (!settingDef) return;

    if (settingDef.editor === 'select') {
      result[s.key] = s.value;
    } else if (settingDef.editor === 'checkbox') {
      result[s.key] = s.value === 'true' ? 'true' : 'false';
    }
  });

  return result;
}

