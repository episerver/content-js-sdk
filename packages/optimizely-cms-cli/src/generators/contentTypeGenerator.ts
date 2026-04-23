import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ContentType,
  ContentTypeProperties,
  DisplayTemplate,
} from './manifest.js';
import { generateDisplayTemplateCode } from './displayTemplateGenerator.js';

/**
 * Generates TypeScript content type definition files from a manifest
 * Optionally includes related display templates in the same file
 */
export async function generateContentTypeFiles(
  contentTypes: ContentType[],
  displayTemplatesByContentType: Map<string, DisplayTemplate[]>,
  outputDir: string,
  contentTypeToGroupMap?: Map<string, string>,
  currentGroup?: string,
): Promise<string[]> {
  const generatedFiles = await Promise.all(
    contentTypes.map(async (contentType) => {
      const fileName = generateFileName(contentType.key);
      const filePath = join(outputDir, fileName);

      // Generate content type code
      let fileContent = generateContentTypeCode(
        contentType,
        contentTypeToGroupMap,
        currentGroup,
      );

      // Append display templates for this specific content type
      const relatedTemplates =
        displayTemplatesByContentType.get(contentType.key) || [];
      if (relatedTemplates.length > 0) {
        // Update import to include displayTemplate
        fileContent = fileContent.replace(
          "import { contentType } from '@optimizely/cms-sdk';",
          "import { contentType, displayTemplate } from '@optimizely/cms-sdk';",
        );

        fileContent += '\n'; // Add spacing
        for (const template of relatedTemplates) {
          const templateCode = generateDisplayTemplateCode(template);
          // Remove the import statement since we already have it at the top of the file
          const codeWithoutImport = templateCode.replace(
            /^import \{ displayTemplate \} from '@optimizely\/cms-sdk';\n\n/,
            '',
          );
          fileContent += '\n' + codeWithoutImport;
        }
      }

      await writeFile(filePath, fileContent, 'utf-8');
      return fileName;
    }),
  );

  return generatedFiles;
}

/**
 * Cleans a key to create a valid TypeScript identifier
 * - Keeps underscores (valid in TS), letters, and numbers
 * - Removes hyphens and other special characters
 * - Preserves case to maintain distinction between similar keys
 * This ensures "Hero-Component" and "Hero_Component" generate different identifiers
 * @throws Error if the key contains no alphanumeric characters
 */
export function cleanKey(key: string): string {
  // Keep letters, numbers, and underscores; remove everything else
  const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');

  if (!cleanKey || !/[a-zA-Z0-9]/.test(cleanKey)) {
    throw new Error(
      `Invalid key "${key}": must contain at least one alphanumeric character`,
    );
  }

  return cleanKey;
}

/**
 * Generates a valid file name from a key
 * @throws Error if the key contains no alphanumeric characters
 */
export function generateFileName(key: string): string {
  // e.g., "HelloWorld_Article" -> "HelloWorld_Article.ts"
  return `${cleanKey(key)}.ts`;
}

/**
 * Generates the TypeScript code for a content type definition
 */
export function generateContentTypeCode(
  contentType: ContentType,
  contentTypeToGroupMap?: Map<string, string>,
  currentGroup?: string,
): string {
  const exportName = generateExportName(contentType.key);

  // Collect component imports
  const componentImports = new Set<string>();
  const properties = contentType.properties
    ? generatePropertiesCode(
        contentType.properties,
        contentType.key,
        componentImports,
      )
    : '{}';

  // Generate import statements
  const imports = ["import { contentType } from '@optimizely/cms-sdk';"];
  if (componentImports.size > 0) {
    const importStatements = Array.from(componentImports).map((key) => {
      const fileName = generateFileName(key);
      const exportName = generateExportName(key);

      // Calculate relative import path when grouping is enabled
      let importPath = `./${fileName.replace('.ts', '.js')}`;
      if (contentTypeToGroupMap && currentGroup) {
        const targetGroup = contentTypeToGroupMap.get(key);
        if (targetGroup && targetGroup !== currentGroup) {
          // Different group - use relative path
          importPath = `../${targetGroup}/${fileName.replace('.ts', '.js')}`;
        }
      }

      return `import { ${exportName} } from '${importPath}';`;
    });
    imports.push(...importStatements);
  }

  // Generate compositionBehaviors if present
  const compositionBehaviors =
    contentType.compositionBehaviors &&
    contentType.compositionBehaviors.length > 0
      ? `\n  compositionBehaviors: [${contentType.compositionBehaviors.map((b) => `'${escapeSingleQuote(b)}'`).join(', ')}],`
      : '';

  // Generate mayContainTypes if present
  const mayContainTypes =
    contentType.mayContainTypes && contentType.mayContainTypes.length > 0
      ? `\n  mayContainTypes: [${contentType.mayContainTypes.map((t) => `'${escapeSingleQuote(t)}'`).join(', ')}],`
      : '';

  const code = `${imports.join('\n')}

/**
 * ${(contentType.displayName || contentType.key).replace(/\*\//g, '*\\/')}
 */
export const ${exportName} = contentType({
  key: '${escapeSingleQuote(contentType.key)}',${contentType.displayName ? `\n  displayName: '${escapeSingleQuote(contentType.displayName)}',` : ''}
  baseType: '${escapeSingleQuote(contentType.baseType)}',${compositionBehaviors}${mayContainTypes}
  properties: ${properties},
});
`;

  return code;
}

/**
 * Generates a valid export name from a content type key
 * @throws Error if the key contains no alphanumeric characters
 */
function generateExportName(key: string): string {
  // Convert to PascalCase and add CT suffix
  // e.g., "HelloWorld_Article" -> "HelloWorldArticleCT"
  return `${cleanKey(key)}CT`;
}

/**
 * Generates the properties object code
 */
function generatePropertiesCode(
  properties: Record<string, ContentTypeProperties.All>,
  contentTypeKey: string,
  componentImports: Set<string>,
): string {
  const propertyEntries = Object.entries(properties).map(([name, prop]) => {
    const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
      ? name
      : `'${escapeSingleQuote(name)}'`;
    const propertyDef = generatePropertyDefinition(
      prop,
      contentTypeKey,
      componentImports,
    );
    return `    ${safeKey}: ${propertyDef}`;
  });

  if (propertyEntries.length === 0) {
    return '{}';
  }

  return `{\n${propertyEntries.join(',\n')},\n  }`;
}

/**
 * Generates a single property definition
 */
function generatePropertyDefinition(
  property: ContentTypeProperties.All,
  contentTypeKey: string,
  componentImports: Set<string>,
): string {
  if ('items' in property && property.type === 'array') {
    // Array type
    const itemDef = generatePropertyDefinition(
      property.items,
      contentTypeKey,
      componentImports,
    );
    return `{\n      type: 'array',\n      items: ${itemDef},\n    }`;
  }

  // Non-array types
  const parts: string[] = [];

  // Base properties
  parts.push(`type: '${property.type}'`);

  if ('displayName' in property && property.displayName) {
    parts.push(`displayName: '${escapeSingleQuote(property.displayName)}'`);
  }

  if ('description' in property && property.description) {
    parts.push(`description: '${escapeSingleQuote(property.description)}'`);
  }

  if ('isRequired' in property && property.isRequired) {
    parts.push(`isRequired: true`);
  }

  if ('isLocalized' in property && property.isLocalized) {
    parts.push(`isLocalized: true`);
  }

  if ('group' in property && property.group) {
    parts.push(`group: '${escapeSingleQuote(property.group)}'`);
  }

  if ('sortOrder' in property && property.sortOrder !== undefined) {
    parts.push(`sortOrder: ${property.sortOrder}`);
  }

  if ('indexingType' in property && property.indexingType) {
    parts.push(`indexingType: '${property.indexingType}'`);
  }

  // Format (common to many types)
  if ('format' in property && property.format) {
    parts.push(`format: '${property.format}'`);
  }

  // String-specific properties
  if (property.type === 'string') {
    if ('pattern' in property && property.pattern) {
      parts.push(`pattern: '${escapeSingleQuote(property.pattern)}'`);
    }

    if ('minLength' in property && property.minLength !== undefined) {
      parts.push(`minLength: ${property.minLength}`);
    }

    if ('maxLength' in property && property.maxLength !== undefined) {
      parts.push(`maxLength: ${property.maxLength}`);
    }

    if ('enum' in property && property.enum) {
      const normalized = normalizeEnumValues(property.enum, 'string');
      const enumValues = normalized
        .map(
          (v) =>
            `\n        { value: '${escapeSingleQuote(String(v.value))}', displayName: '${escapeSingleQuote(v.displayName)}' }`,
        )
        .join(',');
      parts.push(`enum: [${enumValues},\n      ]`);
    }
  }

  // Integer/Float-specific properties
  if (property.type === 'integer' || property.type === 'float') {
    if ('minimum' in property && property.minimum !== undefined) {
      parts.push(`minimum: ${property.minimum}`);
    }

    if ('maximum' in property && property.maximum !== undefined) {
      parts.push(`maximum: ${property.maximum}`);
    }

    if ('enum' in property && property.enum) {
      const normalized = normalizeEnumValues(property.enum, 'number');
      const enumValues = normalized
        .map(
          (v) =>
            `\n        { value: ${v.value}, displayName: '${escapeSingleQuote(v.displayName)}' }`,
        )
        .join(',');
      parts.push(`enum: [${enumValues},\n      ]`);
    }
  }

  // DateTime-specific properties
  if (property.type === 'dateTime') {
    if ('minimum' in property && property.minimum) {
      parts.push(`minimum: '${property.minimum}'`);
    }

    if ('maximum' in property && property.maximum) {
      parts.push(`maximum: '${property.maximum}'`);
    }
  }

  // Content/ContentReference-specific properties
  if (property.type === 'content' || property.type === 'contentReference') {
    if (
      'allowedTypes' in property &&
      property.allowedTypes &&
      property.allowedTypes.length > 0
    ) {
      const types = property.allowedTypes
        .map((t) => (t === '_self' ? contentTypeKey : t))
        .map((t) => `'${escapeSingleQuote(t)}'`)
        .join(', ');
      parts.push(`allowedTypes: [${types}]`);
    }

    if (
      'restrictedTypes' in property &&
      property.restrictedTypes &&
      property.restrictedTypes.length > 0
    ) {
      const types = property.restrictedTypes
        .map((t) => (t === '_self' ? contentTypeKey : t))
        .map((t) => `'${escapeSingleQuote(t)}'`)
        .join(', ');
      parts.push(`restrictedTypes: [${types}]`);
    }
  }

  // Component-specific properties
  if (property.type === 'component') {
    if ('contentType' in property && property.contentType) {
      // Add to imports
      componentImports.add(property.contentType);
      // Use the imported constant name instead of string
      const exportName = generateExportName(property.contentType);
      parts.push(`contentType: ${exportName}`);
    }
  }

  return `{ ${parts.join(', ')} }`;
}

/**
 * Normalizes enum values from different formats to a standard array format.
 * Supports three input formats:
 * 1. SDK format (direct array): [{ value, displayName }, ...]
 * 2. Manifest format (wrapped array): { values: [{ value, displayName }, ...] }
 * 3. OpenAPI format (object map): { values: { "key": "display name", ... } }
 *
 * @param enumDef - The enum definition in any supported format
 * @param valueType - The type of values ('string' or 'number') for proper type conversion
 */
function normalizeEnumValues<T extends string | number>(
  enumDef: any,
  valueType: 'string' | 'number',
): Array<{ value: T; displayName: string }> {
  // Format 1: Direct array - SDK format
  if (Array.isArray(enumDef)) {
    return enumDef;
  }

  // Format 2 & 3: Object with 'values' property
  if (enumDef && typeof enumDef === 'object' && 'values' in enumDef) {
    const { values } = enumDef;

    // Format 2: values is an array
    if (Array.isArray(values)) {
      return values;
    }

    // Format 3: values is an object map { "key": "display name" }
    if (values && typeof values === 'object') {
      return Object.entries(values).map(([key, displayName]) => {
        const value = valueType === 'number' ? Number(key) : key;
        return {
          value: value as T,
          displayName: String(displayName),
        };
      });
    }
  }

  // Fallback: return empty array if format is unrecognized
  console.warn('Unrecognized enum format:', enumDef);
  return [];
}

/**
 * Escapes a string for use in a single-quoted JavaScript/TypeScript string literal
 * Uses JSON.stringify for proper escaping of all special characters
 */
export function escapeSingleQuote(str: string): string {
  // Use JSON.stringify to properly escape all special characters (quotes, backslashes, newlines, etc.)
  // Then convert from double-quoted to single-quoted format
  const jsonEscaped = JSON.stringify(str);
  // Remove outer double quotes and unescape inner double quotes
  const withoutOuterQuotes = jsonEscaped.slice(1, -1).replace(/\\"/g, '"');
  // Escape single quotes for single-quoted string literals
  return withoutOuterQuotes.replace(/'/g, "\\'");
}
