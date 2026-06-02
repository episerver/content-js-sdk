import { join } from 'node:path';
import {
  ManifestContentType,
  ManifestDisplayTemplate,
  JSONContent,
  Manifest,
  SupportedFunctionType,
  SupportedFunctionTypes,
} from './manifest.js';

// EXPORTS

/** Generates TypeScript code for a content type or display template */
export const generateContentCode = (
  content: JSONContent,
  manifest: Manifest,
  useGrouping: boolean = false,
) => {
  const group = useGrouping ? generateGroup(content) : undefined;

  const argumentsWithImports = generateArguments(content);
  const importedComponents = findImportedComponents(manifest, argumentsWithImports);
  const argumentsString = removeImportMarkers(
    argumentsWithImports,
    importedComponents,
    content.key,
  );

  const componentImports = importedComponents
    .filter(it => it.key !== content.key)
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

/** Generates TypeScript code for a full manifest */
export const generateManifestCode = (manifest: Manifest) => {
  const contents = sortByDependencies(
    [...manifest.contentTypes, ...(manifest.displayTemplates || [])],
    manifest,
  );
  const contentTypes: SupportedFunctionType[] = findUsedContentTypes(contents);

  const code = `import { ${contentTypes.join(', ')} } from '@optimizely/cms-sdk';

  ${contents
    .map((content: JSONContent) => {
      const argumentsWithImports = generateArguments(content);
      const importedComponents = findImportedComponents(manifest, argumentsWithImports);
      const argumentsString = removeImportMarkers(
        argumentsWithImports,
        importedComponents,
        content.key,
      );

      return `/**
 * ${generateCommentContent(content)}
 */
export const ${generateName(content)} = ${generateFunctionType(content)}(${argumentsString});
`;
    })
    .join('\n')}
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

/** Generates the file path for a manifest file */
export const generateManifestFilePath = (outputDir: string) =>
  join(outputDir, 'manifest.ts');

/** Returns unique group names from content array */
export const generateGroups = (contents: JSONContent[]) => [
  ...new Set(contents.map(generateGroup)),
];

// ARGUMENT GENERATION

const generateArguments = (content: JSONContent) => {
  if (isContract(content)) return generateContractArguments(content);
  if (isContentType(content)) return generateContentTypeArguments(content);
  return generateDisplayTemplateArguments(content);
};

const generateContentTypeArguments = (content: ManifestContentType) => {
  const functionArguments = {
    key: content.key,
    displayName: content.displayName,
    baseType: content.baseType || 'null',
    compositionBehaviors:
      content.compositionBehaviors?.length ? content.compositionBehaviors : undefined,
    mayContainTypes:
      content.mayContainTypes?.length ?
        content.mayContainTypes.map(it => (isImportable(it) ? markForImport(it) : it))
      : undefined,
    extends:
      content.contracts?.length ?
        content.contracts.map(c => (isImportable(c) ? markForImport(c) : c))
      : undefined,
    properties: generateProperties(content),
  };
  return JSON.stringify(functionArguments, null, 2);
};

const generateContractArguments = (content: ManifestContentType) => {
  const functionArguments = {
    key: content.key,
    displayName: content.displayName,
    properties: generateProperties(content),
  };
  return JSON.stringify(functionArguments, null, 2);
};

const generateDisplayTemplateArguments = (content: ManifestDisplayTemplate) => {
  const functionArguments = {
    key: content.key,
    isDefault: content.isDefault,
    displayName: content.displayName,
    contentType: 'contentType' in content ? content.contentType : undefined,
    nodeType: 'nodeType' in content ? content.nodeType : undefined,
    baseType: 'baseType' in content ? content.baseType : undefined,
    settings: content.settings,
  };
  return JSON.stringify(functionArguments, null, 2);
};

const generateProperties = (content: ManifestContentType) => {
  if (!content.properties || Object.keys(content.properties).length === 0)
    return undefined;
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

const generateImportPath = (
  content: JSONContent,
  fromGroup?: string,
  toGroup?: string,
): string => {
  if (fromGroup !== toGroup) return `../${toGroup}/${generateName(content)}`;
  return `./${generateName(content)}`;
};

const generateName = (content: JSONContent) => {
  const cleaned = cleanKey(content.key);

  if (commonKeyContents.some(it => cleaned.endsWith(it))) return cleaned;

  const nameSuffix =
    isContentType(content) && content.isContract ? 'Contract'
    : isContentType(content) ? 'CT'
    : 'DT';

  return cleaned + nameSuffix;
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

const removeImportMarkers = (
  item: string,
  components: JSONContent[],
  currentKey: string,
) =>
  components
    .reduce(
      (acc, it) =>
        acc.replaceAll(
          `"<|${it.key}|>"`,
          it.key === currentKey ? "'_self'" : generateName(it),
        ),
      item,
    )
    .replaceAll('<|', '')
    .replaceAll('|>', '');

const addImports = (prop: string, value: any) => {
  if (!propertiesThatCanHoldImports.includes(prop)) return value;
  if (typeof value === 'string')
    return isImportable(value) ? markForImport(value) : value;
  if (Array.isArray(value))
    return value.map(it => (isImportable(it) ? markForImport(it) : it));
  return value;
};

const sortByDependencies = (
  contents: JSONContent[],
  manifest: Manifest,
): JSONContent[] => {
  const dependencyMap = new Map<string, Set<string>>();

  // Build dependency graph
  contents.forEach(content => {
    const args = generateArguments(content);
    const dependencies = findImportedComponents(manifest, args);
    dependencyMap.set(content.key, new Set(dependencies.map(d => d.key)));
  });

  // Topological sort
  const sorted: JSONContent[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (key: string) => {
    if (visited.has(key)) return;
    if (visiting.has(key)) return; // Circular dependency, skip

    visiting.add(key);
    const dependencies = dependencyMap.get(key) || new Set();
    dependencies.forEach(depKey => visit(depKey));
    visiting.delete(key);
    visited.add(key);

    const content = contents.find(c => c.key === key);
    if (content) sorted.push(content);
  };

  contents.forEach(content => visit(content.key));
  return sorted;
};

// TYPE GUARDS

const isContentType = (content: JSONContent): content is ManifestContentType =>
  'isContract' in content;

const isContract = (content: JSONContent): boolean =>
  isContentType(content) && content.isContract === true;

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
    throw new Error(
      `Invalid key "${key}": must contain at least one alphanumeric character`,
    );

  return cleaned;
};

const cleanupString = (item: string) =>
  item
    // Remove quotes from object keys: "key": → key:
    .replaceAll(/"(\w+)":/g, '$1:')
    // Convert JSON string literals from double-quoted to single-quoted.
    // For each matched string value: unescape \" → " (safe inside single quotes)
    // and escape any literal ' → \' to avoid breaking the single-quoted string.
    .replaceAll(
      /"((?:[^"\\]|\\.)*)"/g,
      (_, inner: string) => `'${inner.replaceAll('\\"', '"').replaceAll("'", "\\'")}'`,
    );

const findContent = (key: string, manifest: Manifest) =>
  manifest.contentTypes.find(it => it.key === key) ||
  manifest?.displayTemplates?.find(it => it.key === key) ||
  null;

// CONSTANTS

const commonKeyContents = ['Contract', 'CT', 'ContentType', 'DT', 'DisplayTemplate'];

const markedImportRegex = /\<\|(.+?)\|\>/g;

const propertiesThatCanHoldImports = [
  'contentType',
  'allowedTypes',
  'restrictedTypes',
  'extends',
];

const skipPropertyConditions: Record<string, (it: any) => boolean> = {
  isLocalized: (it: any) => it === false,
  isRequired: (it: any) => it === false,
  sortOrder: (it: any) => it === 0,
  allowedTypes: (it: any) => it?.length === 0,
  restrictedTypes: (it: any) => it?.length === 0,
  mayContainTypes: (it: any) => it?.length === 0,
  extends: (it: any) => it?.length === 0,
  contentType: (it: any) => it === undefined,
  nodeType: (it: any) => it === undefined,
  baseType: (it: any) => it === undefined,
};

const findUsedContentTypes = (contents: JSONContent[]): SupportedFunctionType[] => {
  const types: SupportedFunctionType[] = [];
  for (const it of contents) {
    if (types.length === SupportedFunctionTypes.length) break;

    const type = generateFunctionType(it);
    if (!types.includes(type)) types.push(type);
  }

  return types;
};
