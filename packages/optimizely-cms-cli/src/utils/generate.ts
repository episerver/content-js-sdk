import { join } from 'node:path';
import {
  ContentType,
  DisplayTemplate,
  JSONContent,
  Manifest,
  SupportedFunctionType,
} from './manifest.js';

// EXPORTS

/** Generates TypeScript code for a content type or display template */
export const generateCode = (
  content: JSONContent,
  manifest: Manifest,
  useGrouping: boolean = false,
) => {
  const group = useGrouping ? generateGroup(content) : undefined;

  const argumentsWithImports = generateArguments(content);
  const importedComponents = findImportedComponents(manifest, argumentsWithImports);
  const argumentsString = removeImportMarkers(argumentsWithImports, importedComponents);

  const componentImports = importedComponents
    .map(it => generateComponentImport(it, group))
    .join('\n');

  const code = `import { ${generateFunctionType(content)} } from '@optimizely/cms-sdk';
${componentImports ? `${componentImports}\n` : ''}
/**
 * ${generateCommentContent(content)}
 */
export const ${generateName(content)} = ${generateFunctionType(content)}(${argumentsString});
`;

  return cleanupString(code);
};

/** Generates the file path for a content type or display template */
export const generateFilePath = (
  content: JSONContent,
  outputDir: string,
  useGrouping: boolean = false,
) =>
  useGrouping ?
    join(outputDir, generateGroup(content), `${generateName(content)}.ts`)
  : join(outputDir, `${generateName(content)}.ts`);

/** Returns unique group names from content array */
export const generateGroups = (contents: JSONContent[]) => [
  ...new Set(contents.map(generateGroup)),
];

// ARGUMENT GENERATION

const generateArguments = (content: JSONContent) => {
  if (isContentType(content)) return generateContentTypeArguments(content);
  return generateDisplayTemplateArguments(content);
};

const generateContentTypeArguments = (content: ContentType) => {
  const fnArguments = {
    key: content.key,
    displayName: content.displayName,
    baseType: !isContract(content) ? content.baseType || 'null' : undefined,
    compositionBehaviors:
      !isContract(content) && content.compositionBehaviors?.length ?
        content.compositionBehaviors
      : undefined,
    mayContainTypes:
      !isContract(content) && content.mayContainTypes?.length ? content.mayContainTypes : undefined,
    properties: generateProperties(content),
  };
  return JSON.stringify(fnArguments, null, 2);
};

const generateDisplayTemplateArguments = (content: DisplayTemplate) => {
  const fnArguments = {
    key: content.key,
    displayName: content.displayName,
    contentType: content.contentType,
    nodeType: content.nodeType,
    settings: content.settings,
  };
  return JSON.stringify(fnArguments, null, 2);
};

const generateProperties = (content: ContentType) => {
  if (!content.properties || Object.keys(content.properties).length === 0) return undefined;
  return remakeObject(content.properties);
};

// NAME AND PATH GENERATION

const generateCommentContent = (content: JSONContent) =>
  (content.displayName || content.key).replace(/\*\//g, '*\\/');

const generateFunctionType = (content: JSONContent): SupportedFunctionType => {
  if (isContentType(content)) return content.isContract ? 'contract' : 'contentType';
  return 'displayTemplate';
};

const generateGroup = (content: JSONContent) => {
  if (!isContentType(content)) return 'displayTemplates';
  if (isContract(content)) return 'contract';
  return content.baseType?.replace(/^_/, '') ?? '';
};

const generateImportPath = (content: JSONContent, fromGroup?: string, toGroup?: string): string => {
  if (fromGroup !== toGroup) return `../${toGroup}/${generateName(content)}`;
  return `./${generateName(content)}`;
};

const generateName = (content: JSONContent) => {
  const cleaned = cleanKey(content.key);

  if (commonKeyContents.some(it => cleaned.toLowerCase().includes(it.toLowerCase())))
    return cleaned;

  const ending =
    isContentType(content) && content.isContract ? 'Contract'
    : isContentType(content) ? 'CT'
    : 'DT';

  return cleaned + ending;
};

// IMPORT HANDLING

const findImportedComponents = (manifest: Manifest, contents: string): JSONContent[] =>
  extractMarkedImports(contents)
    .map(it => findContent(it, manifest))
    .filter(it => it !== null);

const generateComponentImport = (content: JSONContent, fromGroup?: string) => {
  const toGroup = fromGroup ? generateGroup(content) : undefined;
  return `import { ${generateName(content)} } from '${generateImportPath(content, fromGroup, toGroup)}';`;
};

const extractMarkedImports = (content: string): string[] => {
  const matches = content.matchAll(markedImportRegex);
  return [...new Set(Array.from(matches, match => match[1]))];
};

const markForImport = (item: string): string => `<|${item}|>`;

const removeImportMarkers = (item: string, components: JSONContent[]) =>
  components.reduce((acc, it) => acc.replaceAll(`"<|${it.key}|>"`, generateName(it)), item);

const addImports = (prop: string, value: any) => {
  if (!propertiesThatCanHoldImports.includes(prop)) return value;
  if (typeof value === 'string') return isImportable(value) ? markForImport(value) : value;
  if (Array.isArray(value)) return value.map(it => (isImportable(it) ? markForImport(it) : it));
  return value;
};

// TYPE GUARDS

const isContract = (content: JSONContent) => isContentType(content) && content.isContract;

const isContentType = (content: JSONContent): content is ContentType => 'isContract' in content;

const isImportable = (value: string) => !value.startsWith('_');

const isObject = (item: unknown): item is Record<string, unknown> =>
  typeof item === 'object' && item !== null && Array.isArray(item) === false;

// OBJECT TRANSFORMATION

const remakeObject = (item: Record<string, unknown>): Record<string, unknown> =>
  Object.entries(item)
    .filter(([key, value]) => showProperty(key, value))
    .reduce((acc, [key, value]) => {
      const newValue = isObject(value) ? remakeObject(value) : addImports(key, value);
      return { ...acc, [key]: newValue };
    }, {});

const showProperty = (prop: string, value: any) => {
  if (prop in skipPropertyConditions) return !skipPropertyConditions[prop](value);
  return true;
};

// STRING UTILITIES

const cleanKey = (key: string) => {
  const cleaned = key.replace(/[^a-zA-Z0-9_]/g, '');
  if (!cleaned || !/[a-zA-Z0-9]/.test(cleaned))
    throw new Error(`Invalid key "${key}": must contain at least one alphanumeric character`);

  return cleaned;
};

const cleanupString = (item: string) => item.replaceAll(/"(\w+)":/g, '$1:').replaceAll('"', "'");

const findContent = (key: string, manifest: Manifest) =>
  manifest.contentTypes.find(it => it.key === key) ||
  manifest?.displayTemplates?.find(it => it.key === key) ||
  null;

// CONSTANTS

const commonKeyContents = ['Contract', 'CT', 'ContentType', 'DT', 'DisplayTemplate'];

const markedImportRegex = /\<\|(.+?)\|\>/g;

const propertiesThatCanHoldImports = ['contentType', 'allowedTypes', 'restrictedTypes'];

const skipPropertyConditions: Record<string, (it: any) => boolean> = {
  isLocalized: (it: any) => it === false,
  isRequired: (it: any) => it === false,
  sortOrder: (it: any) => it === 0,
  allowedTypes: (it: any) => it?.length === 0,
  restrictedTypes: (it: any) => it?.length === 0,
  mayContainTypes: (it: any) => it?.length === 0,
};
