import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ContentType, ContentTypeProperties, DisplayTemplate } from './manifest.js';
import { generateDisplayTemplateCode } from './displayTemplateGenerator.js';

/**
 * Generates TypeScript content type definition files from a manifest
 * Optionally includes related display templates in the same file
 */
export async function generateContentTypeFiles(
  contentTypes: ContentType[],
  displayTemplatesByContentType: Map<string, DisplayTemplate[]>,
  outputDir: string,
): Promise<string[]> {
  const generatedFiles: string[] = [];

  for (const contentType of contentTypes) {
    const fileName = generateFileName(contentType.key);
    const filePath = join(outputDir, fileName);

    // Generate content type code
    let fileContent = generateContentTypeCode(contentType);

    // Append display templates for this specific content type
    const relatedTemplates = displayTemplatesByContentType.get(contentType.key) || [];
    if (relatedTemplates.length > 0) {
      // Update import to include displayTemplate
      fileContent = fileContent.replace(
        "import { contentType } from '@optimizely/cms-sdk';",
        "import { contentType, displayTemplate } from '@optimizely/cms-sdk';"
      );

      fileContent += '\n'; // Add spacing
      for (const template of relatedTemplates) {
        const templateCode = generateDisplayTemplateCode(template);
        // Remove the import statement since we already have it at the top of the file
        const codeWithoutImport = templateCode
          .replace(/^import \{ displayTemplate \} from '@optimizely\/cms-sdk';\n\n/, '');
        fileContent += '\n' + codeWithoutImport;
      }
    }

    await writeFile(filePath, fileContent, 'utf-8');
    generatedFiles.push(fileName);
  }

  return generatedFiles;
}

/**
 * Generates a valid file name from a content type key
 */
function generateFileName(key: string): string {
  // Convert key to PascalCase and add .ts extension
  // e.g., "HelloWorld_Article" -> "HelloWorldArticle.ts"
  const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '');
  return `${cleanKey}.ts`;
}

/**
 * Generates the TypeScript code for a content type definition
 */
export function generateContentTypeCode(contentType: ContentType): string {
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
      return `import { ${exportName} } from './${fileName.replace('.ts', '.js')}';`;
    });
    imports.push(...importStatements);
  }

  // Generate compositionBehaviors if present
  const compositionBehaviors =
    contentType.compositionBehaviors &&
    contentType.compositionBehaviors.length > 0
      ? `\n  compositionBehaviors: [${contentType.compositionBehaviors.map((b) => `'${b}'`).join(', ')}],`
      : '';

  // Generate mayContainTypes if present
  const mayContainTypes =
    contentType.mayContainTypes && contentType.mayContainTypes.length > 0
      ? `\n  mayContainTypes: [${contentType.mayContainTypes.map((t) => `'${t}'`).join(', ')}],`
      : '';

  const code = `${imports.join('\n')}

/**
 * ${contentType.displayName || contentType.key}
 */
export const ${exportName} = contentType({
  key: '${contentType.key}',${contentType.displayName ? `\n  displayName: '${contentType.displayName}',` : ''}
  baseType: '${contentType.baseType}',${compositionBehaviors}${mayContainTypes}
  properties: ${properties},
});
`;

  return code;
}

/**
 * Generates a valid export name from a content type key
 */
function generateExportName(key: string): string {
  // Convert to PascalCase and add CT suffix
  // e.g., "HelloWorld_Article" -> "HelloWorldArticleCT"
  const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '');
  return `${cleanKey}CT`;
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
    const propertyDef = generatePropertyDefinition(
      prop,
      contentTypeKey,
      componentImports,
    );
    return `    ${name}: ${propertyDef}`;
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

  if ('required' in property && property.required) {
    parts.push(`required: true`);
  }

  if ('localized' in property && property.localized) {
    parts.push(`localized: true`);
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
      const enumValues = property.enum.values
        .map(
          (v) =>
            `\n        { value: '${escapeSingleQuote(v.value)}', displayName: '${escapeSingleQuote(v.displayName)}' }`,
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
      const enumValues = property.enum.values
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
        .map((t) => `'${t}'`)
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
        .map((t) => `'${t}'`)
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
 * Escapes single quotes in strings for code generation
 */
function escapeSingleQuote(str: string): string {
  return str.replace(/'/g, "\\'");
}
