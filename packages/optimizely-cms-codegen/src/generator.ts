import fg from 'fast-glob';
import fs from 'node:fs/promises';
import ts from 'typescript';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Folder for registry.ts: `src` (Vite, Next with src), else `app` (Next without src), else the root.
 * global.d.ts always goes in the root. Both files are meant to be committed.
 */
export async function registryDir(root: string) {
  for (const dir of ['src', 'app']) {
    if (await fs.stat(path.join(root, dir)).then(s => s.isDirectory(), () => false)) return path.join(root, dir);
  }
  return root;
}

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
      console.warn(`[cms-codegen] Skipping non-string pattern: ${typeof p}`);
      return false;
    }
    if (path.isAbsolute(p)) {
      console.warn(`[cms-codegen] Skipping absolute path pattern: ${p}`);
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

// Build output and tool folders; dot folders (`.next`, `.turbo`, `.vercel`) are skipped by the globs and listed here for the watcher.
export const IGNORED_DIRS = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/out/**', '**/coverage/**', '**/.*/**'];

// ============================================================================
// Source Parsing
// Files are parsed (not run) with the TypeScript parser; only top-level statements are read.
// ============================================================================

// baseTypes whose keys are valid entries in `mayContainTypes`
const MAY_CONTAIN_BASE_TYPES = new Set(['_page', '_experience', '_folder']);

interface FileData {
  contentTypeNames: string[];
  contractNames: string[];
  displayTemplateNames: string[];
  /** One entry per content type or contract that declares a key. */
  keys: { name: string; key: string; baseType?: string; isContentType: boolean }[];
  /** Display templates with the `tag` and `contentType` they declare. */
  templates: { name: string; contentType?: string; tag?: string }[];
  /** Names this file imports, as exported by their source (`import { A as B }` gives `A`). */
  imports: Set<string>;
  hasDefaultExport: boolean;
  /** `export const tag = '...'`, the slot a component fills for its content type. */
  tag?: string;
  /** `export const tag` exists but is not a string literal. */
  badTag?: boolean;
  /** `export const tags = { ... }`, the component's tag variants. */
  hasTags: boolean;
}

const hasModifier = (node: ts.Node, kind: ts.SyntaxKind) =>
  ts.canHaveModifiers(node) && !!ts.getModifiers(node)?.some(m => m.kind === kind);

/** The text of a string literal, or undefined for anything else. */
const stringValue = (node?: ts.Expression) =>
  node && ts.isStringLiteralLike(node) ? node.text : undefined;

/** The object literal passed to `contentType({...})`, `displayTemplate({...})`, etc. */
function callObject(init?: ts.Expression): ts.ObjectLiteralExpression | undefined {
  while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression(init))) init = init.expression;
  if (!init || !ts.isCallExpression(init)) return;
  let arg = init.arguments[0];
  while (arg && (ts.isAsExpression(arg) || ts.isSatisfiesExpression(arg))) arg = arg.expression;
  return arg && ts.isObjectLiteralExpression(arg) ? arg : undefined;
}

/** The function name in `fn({...})`, or undefined when the initializer is not a plain call. */
function calleeName(init?: ts.Expression): string | undefined {
  while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression(init))) init = init.expression;
  return init && ts.isCallExpression(init) && ts.isIdentifier(init.expression) ? init.expression.text : undefined;
}

/** A top-level string property of an object literal. */
function prop(obj: ts.ObjectLiteralExpression | undefined, name: string): string | undefined {
  for (const p of obj?.properties ?? []) {
    if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteralLike(p.name)) && p.name.text === name) {
      return stringValue(p.initializer);
    }
  }
}

/**
 * Extract all relevant data from a source file in one pass.
 * shortcut: only string literal values are read, so `key: SOME_CONST` is not found; add same-file constant lookup if that shows up.
 */
function parseFileContent(content: string, fileName: string): FileData {
  const data: FileData = {
    contentTypeNames: [],
    contractNames: [],
    displayTemplateNames: [],
    keys: [],
    templates: [],
    imports: new Set(),
    hasDefaultExport: false,
    hasTags: false,
  };
  const source = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest);

  for (const node of source.statements) {
    if (ts.isImportDeclaration(node)) {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const el of bindings.elements) data.imports.add((el.propertyName ?? el.name).text);
      }
    } else if (ts.isExportAssignment(node)) {
      data.hasDefaultExport ||= !node.isExportEquals;
    } else if (ts.isExportDeclaration(node)) {
      const named = node.exportClause;
      if (named && ts.isNamedExports(named) && named.elements.some(e => e.name.text === 'default')) {
        data.hasDefaultExport = true;
      }
    } else if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
      hasModifier(node, ts.SyntaxKind.ExportKeyword) &&
      hasModifier(node, ts.SyntaxKind.DefaultKeyword)
    ) {
      data.hasDefaultExport = true;
    } else if (ts.isVariableStatement(node) && hasModifier(node, ts.SyntaxKind.ExportKeyword)) {
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        const name = decl.name.text;
        if (name === 'tag') {
          data.tag = stringValue(decl.initializer);
          data.badTag = data.tag === undefined;
        }
        else if (name === 'tags') data.hasTags = true;
        else {
          // What the variable is assigned decides its kind; the name suffix is the fallback.
          const callee = calleeName(decl.initializer);
          const known = callee === 'displayTemplate' || callee === 'contract' || callee === 'contentType';
          const isTemplate = callee === 'displayTemplate' || (!known && name.endsWith('DisplayTemplate'));
          const isContract = callee === 'contract' || (!known && name.endsWith('Contract'));
          const isContentType = callee === 'contentType' || (!known && name.endsWith('ContentType'));
          if (!isTemplate && !isContract && !isContentType) continue;

          const obj = callObject(decl.initializer);
          if (isTemplate) {
            data.displayTemplateNames.push(name);
            data.templates.push({ name, contentType: prop(obj, 'contentType'), tag: prop(obj, 'tag') });
            continue;
          }
          (isContentType ? data.contentTypeNames : data.contractNames).push(name);
          const key = prop(obj, 'key');
          if (key) data.keys.push({ name, key, baseType: prop(obj, 'baseType'), isContentType });
        }
      }
    }
  }

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
  /** `slot` is the content type key, or `key:tag` for a tagged component. */
  components: { slot: string; local: string; tags?: string }[];
  /** Keys of content types no component was found for. */
  missingComponents: string[];
}

interface ParsedFile {
  file: string;
  parsed: FileData;
  importPath: string;
}

const stripSuffix = (name: string) => name.replace(/ContentType$/, '');
const ownTypes = ({ parsed }: ParsedFile) => parsed.keys.filter(k => k.isContentType);

/**
 * Pick the content type slot a file's default export fills, or undefined when none is found.
 * In order: the file's own content type, a tagged display template it imports, its file name, a content type it imports.
 * `rank` is 1 for an import-only match, so a helper file never beats a file matched more directly.
 * shortcut: a file with several keyed content types gets no component; upgrade if that is common.
 */
function resolveSlot(
  { file, parsed }: ParsedFile,
  own: FileData['keys'],
  typeKeys: Map<string, string>,
  templates: Map<string, FileData['templates'][number]>,
): { key: string; tag?: string; rank: number } | undefined {
  if (own.length === 1) return { key: own[0].key, tag: parsed.tag, rank: 0 };

  const imported = [...parsed.imports];
  const tagged = imported.map(n => templates.get(n)).filter(t => t?.contentType && t.tag);
  if (tagged.length === 1) return { key: tagged[0]!.contentType!, tag: tagged[0]!.tag, rank: 0 };

  const base = path.basename(file).replace(/\.\w+$/, '');
  const byName = [...typeKeys].find(([name, key]) => key === base || stripSuffix(name) === base);
  if (byName) return { key: byName[1], tag: parsed.tag, rank: 0 };

  const types = imported.filter(n => typeKeys.has(n));
  if (types.length === 1) return { key: typeKeys.get(types[0])!, tag: parsed.tag, rank: 1 };
}

/**
 * Register each file's default export as the component for its slot (`Key` or `Key:tag`).
 * Direct matches go before import-only ones, so a helper file never takes a slot from the real component;
 * a later duplicate is ignored, with a warning unless it lost to a file's own content type.
 */
function collectComponents(
  parsedFiles: ParsedFile[],
  typeKeys: Map<string, string>,
  templates: Map<string, FileData['templates'][number]>,
  data: RegistryData,
) {
  const candidates = parsedFiles.flatMap(pf => {
    const own = ownTypes(pf);
    if (!pf.parsed.hasDefaultExport || own.length > 1) return [];
    if (pf.parsed.badTag) {
      console.warn(`[cms-codegen] tag must be a string literal in ${path.relative(process.cwd(), pf.file)}, skipping it`);
      return [];
    }
    const resolved = resolveSlot(pf, own, typeKeys, templates);
    return resolved ? [{ pf, own, resolved }] : [];
  });
  // own-type files first, then other direct matches, then import-only; path order inside each
  const rankOf = ({ own, resolved }: (typeof candidates)[number]) => (own.length === 1 ? 0 : resolved.rank + 1);
  candidates.sort((a, b) => rankOf(a) - rankOf(b));
  const slots = new Map<string, boolean>(); // slot -> claimed by a file's own content type
  const claimedKeys = new Set<string>();
  const taken = new Set([...data.contentTypes, ...data.contracts, ...data.displayTemplates]);

  for (const { pf, own, resolved } of candidates) {
    const { file, parsed, importPath } = pf;
    const slot = resolved.tag ? `${resolved.key}:${resolved.tag}` : resolved.key;
    if (slots.has(slot)) {
      if (!slots.get(slot)) {
        console.warn(`[cms-codegen] '${slot}' already has a component, ignoring ${path.relative(process.cwd(), file)}`);
      }
      continue;
    }
    slots.set(slot, own.length === 1);
    claimedKeys.add(resolved.key);

    let local = own.length === 1 ? stripSuffix(own[0].name) + 'Component' : slot.replace(/\W/g, '_') + 'Component';
    while (taken.has(local)) local += '_'; // never shadow an exported type or template
    taken.add(local);
    const tags = parsed.hasTags ? `${local}Tags` : undefined;
    data.imports.push(`import ${local}${tags ? `, { tags as ${tags} }` : ''} from '${importPath}';`);
    data.components.push({ slot, local, tags });
  }

  data.missingComponents = [...typeKeys.values()].filter(k => !claimedKeys.has(k));
}

/**
 * Read and parse all component files in parallel.
 * Returns parsed data for both registry and type generation.
 */
async function parseAllFiles(files: string[], registryFile: string): Promise<RegistryData> {
  const data: RegistryData = {
    imports: [],
    contentTypes: [],
    contracts: [],
    displayTemplates: [],
    contentTypeKeys: new Set(),
    mayContainKeys: new Set(),
    components: [],
    missingComponents: [],
  };
  const typeKeys = new Map<string, string>(); // content type export name -> key
  const templates = new Map<string, FileData['templates'][number]>();
  const exportedBy = new Map<string, string>(); // exported name -> file

  // Sorted, so which duplicate wins does not depend on glob order.
  const sorted = [...files].sort();
  const contents = await Promise.all(sorted.map(file => fs.readFile(file, 'utf-8')));

  const parsedFiles: ParsedFile[] = sorted.map((file, i) => {
    const parsed = parseFileContent(contents[i], file);
    const importPath = resolveImportPath(file, registryFile);
    const importItems = [
      ...parsed.contentTypeNames,
      ...parsed.displayTemplateNames,
      ...parsed.contractNames,
    ];
    for (const name of importItems) {
      const other = exportedBy.get(name);
      if (other) {
        throw new Error(`'${name}' is exported by both ${path.relative(process.cwd(), other)} and ${path.relative(process.cwd(), file)}. Rename one.`);
      }
      exportedBy.set(name, file);
    }
    data.contentTypes.push(...parsed.contentTypeNames);
    data.displayTemplates.push(...parsed.displayTemplateNames);
    data.contracts.push(...parsed.contractNames);

    for (const { name, key, baseType, isContentType } of parsed.keys) {
      data.contentTypeKeys.add(key);
      if (isContentType) typeKeys.set(name, key);
      if (isContentType && baseType && MAY_CONTAIN_BASE_TYPES.has(baseType)) {
        data.mayContainKeys.add(key);
      }
    }
    for (const t of parsed.templates) templates.set(t.name, t);

    if (importItems.length > 0) {
      data.imports.push(`import { ${importItems.join(', ')} } from '${importPath}';`);
    }
    return { file, parsed, importPath };
  });

  collectComponents(parsedFiles, typeKeys, templates, data);
  return data;
}

/**
 * Generate registry.ts file content.
 * Imports all content types, contracts, and display templates.
 * Exports arrays and init function for registration.
 */
function buildRegistryContent(data: RegistryData): string {
  // Add SDK imports and BlankExperienceContentType at beginning
  const hasComponents = data.components.length > 0;
  const imports = [
    `import { BlankExperienceContentType, initContentTypeRegistry, initDisplayTemplateRegistry } from '@optimizely/cms-sdk';`,
    ...(hasComponents ?
      [
        `import type { ComponentType } from 'react';`,
        `import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';`,
      ]
    : []),
    ...data.imports,
  ];

  const contentTypes = [
    'BlankExperienceContentType',
    ...data.contentTypes,
    ...data.contracts,
  ];

  return `// @generated – do not edit

${imports.join('\n')}

// Content types to register
export const contentTypes = [
${contentTypes.map((t: string) => `  ${t},`).join('\n')}
]

// Display templates to register
export const displayTemplates = [
${data.displayTemplates.map((t: string) => `  ${t},`).join('\n')}
];

${
    hasComponents ?
      `// React components by content type key
export const components = {
${data.components
  .map(c => `  '${q(c.slot)}': ${c.tags ? `{ default: ${c.local}, tags: ${c.tags} }` : c.local},`)
  .join('\n')}
};

// Initialize registries. \`extraComponents\` adds or overrides components, such as ones without a content type.
export function initRegistry(
  extraComponents: Record<string, ComponentType<any> | { default: ComponentType<any>; tags?: Record<string, ComponentType<any>> }> = {},
) {
  initContentTypeRegistry(contentTypes);
  initDisplayTemplateRegistry(displayTemplates);
  initReactComponentRegistry({ resolver: { ...components, ...extraComponents } });
}`
    : `// Initialize registries
export function initRegistry() {
  initContentTypeRegistry(contentTypes);
  initDisplayTemplateRegistry(displayTemplates);
}`
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
): string {
  const sortedContentTypes = Array.from(contentTypeKeys).sort();
  const sortedPropertyGroups = Array.from(propertyGroupKeys).sort();
  const sortedMayContain = Array.from(mayContainKeys).sort();

  return `// @generated – do not edit

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

export {};
`;
}

// ============================================================================
// Main Entry Point
// ============================================================================

// Skipping identical writes stops a watch loop when a glob also matches the output.
// Writes go to a temp file first, so a bundler never reads a half-written file.
// Returns true when the file differs from `content`; with `check` nothing is written.
async function writeIfChanged(file: string, content: string, check: boolean) {
  const existing = await fs.readFile(file, 'utf-8').catch(() => null);
  // Line endings are ignored, so a CRLF checkout does not count as stale.
  if (existing?.replace(/\r\n/g, '\n') === content) return false;
  if (!check) {
    const tmp = `${file}.${process.pid}.tmp`;
    try {
      await fs.writeFile(tmp, content);
      await fs.rename(tmp, file);
    } catch (error) {
      await fs.rm(tmp, { force: true });
      throw error;
    }
  }
  return true;
}

/**
 * Main generator function. Throws when `optimizely.config.mjs` is missing.
 * Scans components, generates registry.ts and global.d.ts files.
 * Optimized: reads all files once, parses once, generates both outputs.
 */
export async function generate(root = process.cwd(), { check = false } = {}) {
  const config = await loadConfig(root);
  if (!config) {
    throw new Error(`optimizely.config.mjs not found in ${root}. Nothing was generated.`);
  }
  const files = await scanComponents(root, config);

  const registryFile = path.join(await registryDir(root), 'registry.ts');

  // Parse all files once in parallel
  const data = await parseAllFiles(files, registryFile);

  // Extract property group keys from config
  const propertyGroupKeys = new Set<string>(
    (config?.propertyGroups || [])
      .map((pg: any) => pg.key)
      .filter((k: unknown): k is string => typeof k === 'string'),
  );

  if (data.components.length > 0 && data.missingComponents.length > 0) {
    console.warn(
      `[cms-codegen] No component found for content type(s): ${data.missingComponents.join(', ')}`,
    );
  }

  // Generate both file contents
  const registryContent = buildRegistryContent(data);
  const typesContent = buildTypesContent(
    data.contentTypeKeys,
    propertyGroupKeys,
    data.mayContainKeys,
  );

  const typesFile = path.join(root, 'global.d.ts');
  // allSettled: both writes finish before an error is thrown, so a watch-mode rerun never overlaps one still running.
  const results = await Promise.allSettled([
    writeIfChanged(registryFile, registryContent, check),
    writeIfChanged(typesFile, typesContent, check),
  ]);
  const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failed) throw failed.reason;
  const changed = results.map(r => (r as PromiseFulfilledResult<boolean>).value);

  /** With `check`, the generated files that are missing or out of date. */
  const stale = [registryFile, typesFile].filter((_, i) => changed[i]);
  return { files, registryFile, stale };
}
