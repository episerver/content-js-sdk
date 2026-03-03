import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DisplayTemplate } from './manifest.js';

/**
 * Generates TypeScript display template definition files from a manifest
 */
export async function generateDisplayTemplateFiles(
  displayTemplates: DisplayTemplate[],
  outputDir: string,
): Promise<string[]> {
  const generatedFiles: string[] = [];

  for (const displayTemplate of displayTemplates) {
    const fileName = generateFileName(displayTemplate.key);
    const filePath = join(outputDir, fileName);
    const fileContent = generateDisplayTemplateCode(displayTemplate);

    await writeFile(filePath, fileContent, 'utf-8');
    generatedFiles.push(fileName);
  }

  return generatedFiles;
}

/**
 * Generates a valid file name from a display template key
 * @throws Error if the key contains no alphanumeric characters
 */
function generateFileName(key: string): string {
  // Convert key to PascalCase and add .ts extension
  const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '');

  if (!cleanKey) {
    throw new Error(
      `Invalid display template key "${key}": must contain at least one alphanumeric character`
    );
  }

  return `${cleanKey}.ts`;
}

/**
 * Generates the TypeScript code for a display template definition
 */
export function generateDisplayTemplateCode(displayTemplate: DisplayTemplate): string {
  const exportName = generateExportName(displayTemplate.key);

  // Display templates must have exactly one of: contentType, baseType, or nodeType
  const discriminator = displayTemplate.contentType
    ? { field: 'contentType', value: displayTemplate.contentType }
    : displayTemplate.baseType
      ? { field: 'baseType', value: displayTemplate.baseType }
      : displayTemplate.nodeType
        ? { field: 'nodeType', value: displayTemplate.nodeType }
        : null;

  if (!discriminator) {
    throw new Error(
      `Display template ${displayTemplate.key} is missing contentType, baseType, or nodeType`,
    );
  }

  // Build optional fields
  const optionalFields: string[] = [];

  if (displayTemplate.displayName) {
    optionalFields.push(
      `displayName: '${escapeSingleQuote(displayTemplate.displayName)}'`,
    );
  }

  if (displayTemplate.isDefault !== undefined) {
    optionalFields.push(`isDefault: ${displayTemplate.isDefault}`);
  }

  if (
    displayTemplate.settings &&
    Object.keys(displayTemplate.settings).length > 0
  ) {
    const settingsCode = generateSettingsCode(displayTemplate.settings, 2);
    optionalFields.push(`settings: ${settingsCode}`);
  }

  const optionalFieldsStr =
    optionalFields.length > 0 ? ',\n  ' + optionalFields.join(',\n  ') : '';

  const code = `import { displayTemplate } from '@optimizely/cms-sdk';

/**
 * ${(displayTemplate.displayName || displayTemplate.key).replace(/\*\//g, '*\\/')}
 */
export const ${exportName} = displayTemplate({
  key: '${escapeSingleQuote(displayTemplate.key)}',
  ${discriminator.field}: '${escapeSingleQuote(discriminator.value)}'${optionalFieldsStr},
});
`;

  return code;
}

/**
 * Generates a valid export name from a display template key
 * @throws Error if the key contains no alphanumeric characters
 */
function generateExportName(key: string): string {
  // Convert to PascalCase and add DT suffix
  const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '');

  if (!cleanKey) {
    throw new Error(
      `Invalid display template key "${key}": must contain at least one alphanumeric character`
    );
  }

  return `${cleanKey}DT`;
}

/**
 * Generates TypeScript code for settings object
 */
function generateSettingsCode(
  settings: Record<string, any>,
  indentLevel: number = 0,
): string {
  const indent = '  '.repeat(indentLevel);
  const innerIndent = '  '.repeat(indentLevel + 1);

  const entries = Object.entries(settings).map(([key, value]) => {
    const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
      ? key
      : `'${escapeSingleQuote(key)}'`;
    const valueCode = generateValueCode(value, indentLevel + 1);
    return `${innerIndent}${safeKey}: ${valueCode}`;
  });

  if (entries.length === 0) {
    return '{}';
  }

  return `{\n${entries.join(',\n')},\n${indent}}`;
}

/**
 * Generates TypeScript code for a value (handles strings, numbers, booleans, objects, arrays)
 */
function generateValueCode(value: any, indentLevel: number): string {
  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'string') {
    return `'${escapeSingleQuote(value)}'`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const indent = '  '.repeat(indentLevel);
    const innerIndent = '  '.repeat(indentLevel + 1);
    const items = value.map(
      (item) => `${innerIndent}${generateValueCode(item, indentLevel + 1)}`,
    );
    return `[\n${items.join(',\n')},\n${indent}]`;
  }

  if (typeof value === 'object') {
    return generateSettingsCode(value, indentLevel);
  }

  return String(value);
}

/**
 * Escapes a string for use in a single-quoted JavaScript/TypeScript string literal
 * Uses JSON.stringify for proper escaping of all special characters
 */
function escapeSingleQuote(str: string): string {
  // Use JSON.stringify to properly escape all special characters (quotes, backslashes, newlines, etc.)
  // Then convert from double-quoted to single-quoted format
  const jsonEscaped = JSON.stringify(str);
  // Remove outer double quotes and unescape inner double quotes
  const withoutOuterQuotes = jsonEscaped.slice(1, -1).replace(/\\"/g, '"');
  // Escape single quotes for single-quoted string literals
  return withoutOuterQuotes.replace(/'/g, "\\'");
}
