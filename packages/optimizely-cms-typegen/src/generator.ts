import fg from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// ============================================================================
// Config Loading
// ============================================================================

/**
 * Load optimizely.config.mjs from project root.
 * Returns null if config doesn't exist.
 */
export async function loadConfig(root: string) {
  const configPath = path.join(root, 'optimizely.config.mjs');

  try {
    await fs.access(configPath);
    const fileUrl = pathToFileURL(configPath);
    const config = await import(fileUrl.href);
    return config.default;
  } catch {
    return null;
  }
}

// ============================================================================
// Component Scanning
// ============================================================================

/**
 * Validate glob patterns are strings and relative paths
 */
function validatePatterns(patterns: unknown): string[] {
  const normalized = Array.isArray(patterns) ? patterns : [patterns];

  const validated = normalized.filter((p): p is string => {
    if (typeof p !== 'string') {
      console.warn(`[cms-typegen] Skipping non-string pattern: ${typeof p}`);
      return false;
    }
    if (path.isAbsolute(p)) {
      console.warn(`[cms-typegen] Skipping absolute path pattern: ${p}`);
      return false;
    }
    return true;
  });

  if (validated.length === 0) {
    throw new Error('No valid component patterns found in config');
  }

  return validated;
}

/**
 * Scan for component files using glob patterns from config.
 * Returns absolute file paths.
 */
export async function scanComponents(root: string): Promise<string[]> {
  const config = await loadConfig(root);
  if (!config?.components) return [];

  const patterns = validatePatterns(config.components);

  const files = await fg(patterns, {
    cwd: root,
    absolute: true,
  });

  return files;
}

/**
 * Detect base directory (src, app, or root).
 * Checks existence of src/ and app/ directories.
 */
export async function detectBaseDir(root: string): Promise<string> {
  const srcExists = await directoryExists(path.join(root, 'src'));
  const appExists = await directoryExists(path.join(root, 'app'));

  if (srcExists) return 'src';
  if (appExists) return 'app';
  return '.';
}

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Export Pattern Matching
// Note: Pattern matches for contentType, contract, and displayTemplate exports is faster than object inspection.
// ============================================================================

// Improved regex patterns that handle multiline, comments, and edge cases
const EXPORT_PATTERNS = {
  contentType: /export\s+const\s+(\w+ContentType)\s*=/s,
  contract: /export\s+const\s+(\w+Contract)\s*=/s,
  displayTemplate: /export\s+const\s+(\w+DisplayTemplate)\s*=/s,
} as const;

// Match key with single or double quotes, allowing escaped quotes inside
const KEY_PATTERNS = {
  contentType:
    /export\s+const\s+\w+ContentType\s*=\s*contentType\s*\(\s*\{[^}]*key\s*:\s*(['"])([^'"\\]*(?:\\.[^'"\\]*)*)\1/s,
  contract: /export\s+const\s+\w+Contract\s*=\s*contract\s*\(\s*\{[^}]*key\s*:\s*(['"])([^'"\\]*(?:\\.[^'"\\]*)*)\1/s,
} as const;

interface FileData {
  contentTypeName?: string;
  contractName?: string;
  displayTemplateName?: string;
  contentTypeKey?: string;
}

/**
 * Extract all relevant data from file content in one pass.
 */
function parseFileContent(content: string): FileData {
  const contentTypeMatch = content.match(EXPORT_PATTERNS.contentType);
  const contractMatch = content.match(EXPORT_PATTERNS.contract);
  const displayTemplateMatch = content.match(EXPORT_PATTERNS.displayTemplate);

  const contentTypeKeyMatch = content.match(KEY_PATTERNS.contentType);
  const contractKeyMatch = content.match(KEY_PATTERNS.contract);

  return {
    contentTypeName: contentTypeMatch?.[1],
    contractName: contractMatch?.[1],
    displayTemplateName: displayTemplateMatch?.[1],
    contentTypeKey: contentTypeKeyMatch?.[2] || contractKeyMatch?.[2], // Group 2 is now the key value
  };
}

// ============================================================================
// Import Path Resolution
// ============================================================================

/**
 * Convert absolute file path to relative import path for registry.
 * Normalizes Windows paths and adds ./ prefix.
 */
function resolveImportPath(file: string, registryFile: string): string {
  return path
    .relative(path.dirname(registryFile), file)
    .replace(/\\/g, '/')
    .replace(/\.tsx?$/, '')
    .replace(/^(?!\.\.?\/)/, './');
}

// ============================================================================
// Registry Generation
// ============================================================================

interface RegistryData {
  imports: string[];
  contentTypes: string[];
  contracts: string[];
  displayTemplates: string[];
  contentTypeKeys: Set<string>;
}

/**
 * Read and parse all component files in parallel.
 * Returns parsed data for both registry and type generation.
 */
async function parseAllFiles(
  files: string[],
  registryFile: string,
): Promise<RegistryData> {
  const data: RegistryData = {
    imports: [],
    contentTypes: [],
    contracts: [],
    displayTemplates: [],
    contentTypeKeys: new Set(),
  };

  // Read all files in parallel
  const fileContents = await Promise.all(files.map(file => fs.readFile(file, 'utf-8')));

  // Process each file
  files.forEach((file, index) => {
    const content = fileContents[index];
    const parsed = parseFileContent(content);
    const importPath = resolveImportPath(file, registryFile);
    const importItems: string[] = [];

    if (parsed.contentTypeName) {
      importItems.push(parsed.contentTypeName);
      data.contentTypes.push(parsed.contentTypeName);
    }

    if (parsed.displayTemplateName) {
      importItems.push(parsed.displayTemplateName);
      data.displayTemplates.push(parsed.displayTemplateName);
    }

    if (parsed.contractName) {
      importItems.push(parsed.contractName);
      data.contracts.push(parsed.contractName);
    }

    if (parsed.contentTypeKey) {
      data.contentTypeKeys.add(parsed.contentTypeKey);
    }

    if (importItems.length > 0) {
      data.imports.push(`import { ${importItems.join(', ')} } from '${importPath}';`);
    }
  });

  return data;
}

/**
 * Generate registry.ts file content.
 * Imports all content types, contracts, and display templates.
 * Exports arrays and init function for registration.
 */
function buildRegistryContent(data: RegistryData): string {
  // Add SDK imports and BlankExperienceContentType at beginning
  const imports = [
    `import { BlankExperienceContentType, initContentTypeRegistry, initDisplayTemplateRegistry } from '@optimizely/cms-sdk';`,
    ...data.imports,
  ];

  const contentTypes = [
    'BlankExperienceContentType',
    ...data.contentTypes,
    ...data.contracts,
  ];

  return `// Auto-generated by @optimizely/cms-typegen
// Do not edit manually

${imports.join('\n')}

// Content types to register
export const contentTypes = [
${contentTypes.map((t: string) => `  ${t},`).join('\n')}
]

// Display templates to register
export const displayTemplates = [
${data.displayTemplates.map((t: string) => `  ${t},`).join('\n')}
];

// Initialize registries
export function initRegistry() {
  initContentTypeRegistry(contentTypes);
  initDisplayTemplateRegistry(displayTemplates);
}
`;
}

// ============================================================================
// Type Declaration Generation
// ============================================================================

/**
 * Generate global.d.ts type declarations.
 * Augments ContentTypeRegistry and PropertyGroupRegistry interfaces.
 */
function buildTypesContent(
  contentTypeKeys: Set<string>,
  propertyGroupKeys: Set<string>,
): string {
  const sortedContentTypes = Array.from(contentTypeKeys).sort();
  const sortedPropertyGroups = Array.from(propertyGroupKeys).sort();

  return `// Auto-generated by @optimizely/cms-typegen
// Do not edit manually

declare module '@optimizely/cms-sdk' {
  export interface ContentTypeRegistry {
${sortedContentTypes.map(key => `    '${key}': string;`).join('\n')}
  }

  export interface PropertyGroupRegistry {
${sortedPropertyGroups.map(key => `    '${key}': string;`).join('\n')}
  }
}

export {};
`;
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Main generator function.
 * Scans components, generates registry.ts and global.d.ts files.
 * Optimized: reads all files once, parses once, generates both outputs.
 */
export async function generate(root = process.cwd()) {
  // Load config and scan files
  const [config, files] = await Promise.all([loadConfig(root), scanComponents(root)]);

  const baseDir = await detectBaseDir(root);
  const registryDir = path.join(root, baseDir);
  const registryFile = path.join(registryDir, 'registry.ts');

  // Parse all files once in parallel
  const data = await parseAllFiles(files, registryFile);

  // Extract property group keys from config
  const propertyGroupKeys = new Set<string>(
    (config?.propertyGroups || []).map((pg: any) => pg.key as string),
  );

  // Generate both file contents
  const registryContent = buildRegistryContent(data);
  const typesContent = buildTypesContent(data.contentTypeKeys, propertyGroupKeys);

  // Ensure output directory exists and write both files in parallel
  await fs.mkdir(registryDir, { recursive: true });
  await Promise.all([
    fs.writeFile(registryFile, registryContent),
    fs.writeFile(path.join(root, 'global.d.ts'), typesContent),
  ]);

  return { files, baseDir };
}
