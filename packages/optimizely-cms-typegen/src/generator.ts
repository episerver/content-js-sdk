import fg from 'fast-glob';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// ============================================================================
// Config Loading
// ============================================================================

let loadCount = 0;

/**
 * Load optimizely.config.mjs from project root.
 * Returns null if config doesn't exist. Errors in the config itself are thrown.
 */
export async function loadConfig(root: string) {
  const configPath = path.join(root, 'optimizely.config.mjs');

  try {
    await fs.access(configPath);
  } catch {
    return null;
  }

  // Query string busts Node's import cache so watch mode sees config edits.
  const config = await import(`${pathToFileURL(configPath).href}?t=${Date.now()}-${loadCount++}`);
  return config.default ?? null;
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
export async function scanComponents(
  root: string,
  loaded?: Awaited<ReturnType<typeof loadConfig>>,
): Promise<string[]> {
  const config = loaded === undefined ? await loadConfig(root) : loaded;
  if (!config?.components) return [];

  return fg(validatePatterns(config.components), { cwd: root, absolute: true });
}

// ============================================================================
// Platform Detection
// ============================================================================

export const PLATFORM_GLOB = '**/*.{ts,tsx,js,jsx,mjs}';
const PLATFORM_IGNORE = ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.d.ts'];
// `config({ ... platform: 'paas' })`, allowing one level of nested braces before `platform`.
const PLATFORM_RE =
  /\bconfig\s*\(\s*\{(?:[^{}]|\{[^{}]*\})*?\bplatform\s*:\s*(['"])(saas|paas)\1/;

/**
 * Find the literal `platform` passed to the SDK's `config()` in app source.
 * Returns undefined when absent (the SDK then defaults to SaaS).
 * shortcut: first literal match wins and `platform: someVariable` is not seen; upgrade to an AST parse if that shows up.
 */
export async function detectPlatform(root: string): Promise<'saas' | 'paas' | undefined> {
  const files = await fg(PLATFORM_GLOB, { cwd: root, absolute: true, ignore: PLATFORM_IGNORE });
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    if (!content.includes('@optimizely/cms-sdk')) continue;
    const platform = content.match(PLATFORM_RE)?.[2];
    if (platform) return platform as 'saas' | 'paas';
  }
}

/** Base directory for generated files: src, app, or the project root. */
export function detectBaseDir(root: string): string {
  return ['src', 'app'].find(dir => existsSync(path.join(root, dir))) ?? '.';
}

// ============================================================================
// Export Pattern Matching
// Note: Pattern matches for contentType, contract, and displayTemplate exports is faster than object inspection.
// ============================================================================

const EXPORT_RE = /export\s+const\s+(\w+(?:ContentType|Contract|DisplayTemplate))\s*=/g;
const KEY_RE = /\bkey\s*:\s*(['"])([^'"\\]*(?:\\.[^'"\\]*)*)\1/;
const BASE_TYPE_RE = /\bbaseType\s*:\s*(['"])([^'"]*)\1/;

// baseTypes whose keys are valid entries in `mayContainTypes`
const MAY_CONTAIN_BASE_TYPES = new Set(['_page', '_experience', '_folder']);

interface FileData {
  contentTypeNames: string[];
  contractNames: string[];
  displayTemplateNames: string[];
  /** One entry per content type or contract that declares a key. */
  keys: { key: string; baseType?: string; isContentType: boolean }[];
}

/**
 * Extract all relevant data from file content in one pass.
 * Each export's key is read from the text up to the next export, so keys
 * stay tied to their own export.
 * shortcut: first `key:` after the export wins, so a nested `key:` before the top-level one is misread; upgrade to an AST parse if that shows up.
 */
function parseFileContent(content: string): FileData {
  const data: FileData = {
    contentTypeNames: [],
    contractNames: [],
    displayTemplateNames: [],
    keys: [],
  };
  const matches = [...content.matchAll(EXPORT_RE)];

  matches.forEach((m, i) => {
    const name = m[1];
    const body = content.slice(m.index! + m[0].length, matches[i + 1]?.index);

    if (name.endsWith('DisplayTemplate')) {
      data.displayTemplateNames.push(name);
      return;
    }
    const isContentType = name.endsWith('ContentType');
    (isContentType ? data.contentTypeNames : data.contractNames).push(name);

    const key = body.match(KEY_RE)?.[2];
    if (key) {
      data.keys.push({ key, baseType: body.match(BASE_TYPE_RE)?.[2], isContentType });
    }
  });

  return data;
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
  mayContainKeys: Set<string>;
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
    mayContainKeys: new Set(),
  };

  // Read all files in parallel
  const fileContents = await Promise.all(files.map(file => fs.readFile(file, 'utf-8')));

  // Process each file
  files.forEach((file, index) => {
    const content = fileContents[index];
    const parsed = parseFileContent(content);
    const importPath = resolveImportPath(file, registryFile);
    const importItems: string[] = [];

    importItems.push(
      ...parsed.contentTypeNames,
      ...parsed.displayTemplateNames,
      ...parsed.contractNames,
    );
    data.contentTypes.push(...parsed.contentTypeNames);
    data.displayTemplates.push(...parsed.displayTemplateNames);
    data.contracts.push(...parsed.contractNames);

    for (const { key, baseType, isContentType } of parsed.keys) {
      data.contentTypeKeys.add(key);
      if (isContentType && baseType && MAY_CONTAIN_BASE_TYPES.has(baseType)) {
        data.mayContainKeys.add(key);
      }
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
 * Augments ContentTypeRegistry, PropertyGroupRegistry, and MayContainRegistry interfaces.
 */
const q = (key: string) => JSON.stringify(key).slice(1, -1).replace(/'/g, "\\'");

function buildTypesContent(
  contentTypeKeys: Set<string>,
  propertyGroupKeys: Set<string>,
  mayContainKeys: Set<string>,
  platform?: 'saas' | 'paas',
): string {
  const sortedContentTypes = Array.from(contentTypeKeys).sort();
  const sortedPropertyGroups = Array.from(propertyGroupKeys).sort();
  const sortedMayContain = Array.from(mayContainKeys).sort();

  return `// Auto-generated by @optimizely/cms-typegen
// Do not edit manually

declare module '@optimizely/cms-sdk' {
  export interface ContentTypeRegistry {
${sortedContentTypes.map(key => `    '${q(key)}': string;`).join('\n')}
  }

  export interface PropertyGroupRegistry {
${sortedPropertyGroups.map(key => `    '${q(key)}': string;`).join('\n')}
  }

  export interface MayContainRegistry {
${sortedMayContain.map(key => `    '${q(key)}': string;`).join('\n')}
  }
}

${
    platform ?
      `
declare global {
  interface OptimizelyCmsRegister {
    platform: '${platform}';
  }
}
`
    : ''
  }
export {};
`;
}

// ============================================================================
// Main Entry Point
// ============================================================================

// Skipping identical writes stops a watch loop when a glob also matches the output.
async function writeIfChanged(file: string, content: string) {
  const existing = await fs.readFile(file, 'utf-8').catch(() => null);
  if (existing !== content) await fs.writeFile(file, content);
}

/**
 * Main generator function.
 * Scans components, generates registry.ts and global.d.ts files.
 * Optimized: reads all files once, parses once, generates both outputs.
 */
export async function generate(root = process.cwd()) {
  // Load config and scan files
  const config = await loadConfig(root);
  const files = await scanComponents(root, config);

  const baseDir = detectBaseDir(root);
  const registryDir = path.join(root, baseDir);
  const registryFile = path.join(registryDir, 'registry.ts');

  // Parse all files once in parallel
  const data = await parseAllFiles(files, registryFile);

  // Extract property group keys from config
  const propertyGroupKeys = new Set<string>(
    (config?.propertyGroups || [])
      .map((pg: any) => pg.key)
      .filter((k: unknown): k is string => typeof k === 'string'),
  );

  // Generate both file contents
  const registryContent = buildRegistryContent(data);
  const typesContent = buildTypesContent(
    data.contentTypeKeys,
    propertyGroupKeys,
    data.mayContainKeys,
    await detectPlatform(root),
  );

  // Ensure output directory exists and write both files in parallel
  await fs.mkdir(registryDir, { recursive: true });
  await Promise.all([
    writeIfChanged(registryFile, registryContent),
    writeIfChanged(path.join(root, 'global.d.ts'), typesContent),
  ]);

  return { files, baseDir };
}
