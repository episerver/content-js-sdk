import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DisplayTemplate } from './manifest.js';
import {
  cleanKey,
  escapeSingleQuote,
  generateFileName,
} from './contentTypeGenerator.js';

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
 * Generates the TypeScript code for a display template definition
 */
export function generateDisplayTemplateCode(displayTemplate: DisplayTemplate): string {
  const exportName = generateExportName(displayTemplate.key);

  // Display templates must have exactly one of: contentType, baseType, or nodeType
  const presentDiscriminators: Array<{ field: string; value: string }> = [];

  if (displayTemplate.contentType) {
    presentDiscriminators.push({ field: 'contentType', value: displayTemplate.contentType });
  }
  if (displayTemplate.baseType) {
    presentDiscriminators.push({ field: 'baseType', value: displayTemplate.baseType });
  }
  if (displayTemplate.nodeType) {
    presentDiscriminators.push({ field: 'nodeType', value: displayTemplate.nodeType });
  }

  if (presentDiscriminators.length === 0) {
    throw new Error(
      `Display template "${displayTemplate.key}" is missing a type field. Must have exactly one of: contentType, baseType, or nodeType.`,
    );
  }

  if (presentDiscriminators.length > 1) {
    const fields = presentDiscriminators.map(d => d.field).join(', ');
    throw new Error(
      `Display template "${displayTemplate.key}" has multiple type fields: ${fields}. Only one of contentType, baseType, or nodeType is allowed.`,
    );
  }

  const discriminator = presentDiscriminators[0];

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
  return `${cleanKey(key)}DT`;
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

