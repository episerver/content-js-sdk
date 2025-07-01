import { isContentType } from './../index.js';
import {
  ALL_BASE_TYPES,
  AnyContentType,
  BaseTypes,
  ContentType,
} from './contentTypes.js';
import { getDisplayTemplate } from './displayTemplateRegistry.js';

// section node types
export const NODE_TYPES = ['row', 'column'] as const;

// cms editor types
export const EDITOR_TYPE = ['select', 'checkbox'] as const;

type NodeType = (typeof NODE_TYPES)[number];

type EditorType = (typeof EDITOR_TYPE)[number];

type TemplateTypeInput = string | (AnyContentType & { __type: 'contentType' });

type NodeTemplate = {
  nodeType: NodeType;
  baseType?: never;
  contentType?: never;
};

type BaseTemplate = {
  baseType: BaseTypes;
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

export type DisplaySettingsInput = Record<
  string,
  | Record<string, string> // select
  | {
      editor?: EditorType;
      displayName?: string;
      value: string;
    }
>;

export type DisplaySetting = { key: string; value: string };

type DisplayTemplateInput = Array<DisplaySetting>;

export type DisplayTemplateConfig = DisplayTemplate & {
  __type: 'displayTemplate';
  template: DisplaySettingsInput;
  tag?: string; // Optional tag property to store the name of the React component
};

// Generic type guard factory
function createTypeGuard<T extends readonly string[]>(array: T) {
  return (value: string): value is T[number] => {
    return array.includes(value as T[number]);
  };
}

// Create specific type guards
const isNodeType = createTypeGuard(NODE_TYPES);
const isBaseTypes = createTypeGuard(ALL_BASE_TYPES);

/**
 * Resolves the template type based on the provided input.
 *
 * @param input - The input to determine the template type. Can be a string or an object.
 * @returns A resolved template type object: `NodeTemplate`, `BaseTemplate`, or `WithContentType`.
 * @throws An error if the input is invalid (unreachable with current typing).
 */
function resolveTemplateType(
  input: TemplateTypeInput
): NodeTemplate | BaseTemplate | WithContentType {
  if (typeof input === 'string') {
    if (isNodeType(input)) {
      return { nodeType: input as NodeType };
    }

    if (isBaseTypes(input)) {
      return { baseType: input as BaseTypes };
    }

    return { contentType: input };
  }

  if (isContentType(input)) {
    return { contentType: input.key };
  }

  // This case is technically unreachable with current typing
  throw new Error('Invalid template type input');
}

export function createDisplayTemplate(
  key: string,
  templateType: BaseTypes | '_component',
  stylesInput: DisplaySettingsInput,
  isDefault?: boolean,
  tag?: React.ComponentType<any> // Optional React component
): DisplayTemplateConfig;

export function createDisplayTemplate(
  key: string,
  templateType: NodeType,
  stylesInput: DisplaySettingsInput,
  isDefault?: boolean,
  tag?: React.ComponentType<any> // Optional React component
): DisplayTemplateConfig;

export function createDisplayTemplate(
  key: string,
  templateType: string,
  stylesInput: DisplaySettingsInput,
  isDefault?: boolean,
  tag?: React.ComponentType<any> // Optional React component
): DisplayTemplateConfig;

/**
 * Creates a display configuration object for a given template type and styles input.
 *
 * @param key - The unique key identifying the display configuration.
 * @param templateType - The type of the template, used to resolve the template type object.
 * @param stylesInput - An object defining the styles and their configurations.
 * @param isDefault - A boolean indicating whether this configuration is the default. Defaults to `false`.
 * @returns A `DisplayTemplateConfig` object containing the display configuration.
 */
export function createDisplayTemplate(
  key: string,
  templateType: TemplateTypeInput,
  stylesInput: DisplaySettingsInput,
  isDefault = false,
  tag?: React.ComponentType<any> // Optional React component
): DisplayTemplateConfig {
  const settings: SettingsType = {};
  let sortOrder = 0;

  const typeObject = resolveTemplateType(templateType);

  const capitalize = (s: string) =>
    typeof s === 'string' && s.length > 0
      ? s.charAt(0).toUpperCase() + s.slice(1)
      : '';

  for (const styleKey in stylesInput) {
    if (!Object.hasOwnProperty.call(stylesInput, styleKey)) continue;

    const styleDef = stylesInput[styleKey];

    const editor: EditorType =
      typeof styleDef === 'object' &&
      'editor' in styleDef &&
      styleDef.editor === 'checkbox'
        ? 'checkbox'
        : 'select';

    const styleDisplayName =
      typeof styleDef === 'object' &&
      'displayName' in styleDef &&
      typeof styleDef.displayName === 'string'
        ? styleDef.displayName
        : capitalize(styleKey);

    let choices: ChoiceType = {};

    if (editor === 'checkbox') {
      choices = {
        [styleKey]: {
          displayName: styleDisplayName,
          sortOrder: 0,
        },
      };
    } else {
      let variantSort = 0;
      for (const variantKey in styleDef as Record<string, string>) {
        if (!Object.hasOwnProperty.call(styleDef, variantKey)) continue;

        choices[variantKey] = {
          displayName: capitalize(variantKey),
          sortOrder: variantSort++,
        };
      }
    }

    settings[styleKey] = {
      displayName: styleDisplayName,
      editor,
      sortOrder: sortOrder++,
      choices,
    };
  }

  return {
    key,
    displayName: key,
    isDefault,
    ...typeObject,
    settings,
    template: stylesInput,
    __type: 'displayTemplate',
    tag: tag ? tag.name : undefined, // Add the tag property with the component name
  };
}

/**
 * Retrieves the selected style values based on the provided display settings and template name.
 *
 * @param displaySettings - An array of display settings, where each setting contains a `key` and a `value`.
 * @param templateName - The name of the display template to retrieve style definitions for.
 * @returns An array of selected style values as strings. If no styles are found, an empty array is returned.
 */
export function getSelectedDisplaySettings(
  displaySettings: DisplayTemplateInput,
  templateName: string
): {
  displaySettings: string[];
  tag: string | undefined;
} {
  const displayTemplate = getDisplayTemplate(templateName);
  if (!displayTemplate || !displayTemplate.template) {
    return { displaySettings: [], tag: undefined };
  }

  const displaySettingsValues = displaySettings
    .map(({ key, value }) => {
      const styleDef = displayTemplate.template[key];
      if (!styleDef) return null;

      if (
        typeof styleDef === 'object' &&
        'editor' in styleDef &&
        styleDef.editor === 'checkbox'
      ) {
        return value === 'true' ? styleDef.value ?? '' : '';
      }

      if (typeof styleDef === 'object' && value in styleDef) {
        return (styleDef as Record<string, string>)[value];
      }

      return null;
    })
    .filter((v): v is string => typeof v === 'string' && v !== '');

  return {
    displaySettings: displaySettingsValues,
    tag: displayTemplate.tag,
  };
}
