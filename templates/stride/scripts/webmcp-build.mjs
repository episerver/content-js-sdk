/**
 * webmcp:build — validate webmcp/tools.js, then copy it byte-identical to
 * public/webmcp-tools.js (issue 0002 work item 2).
 *
 * The source is a hand-written classic script; validation is STATIC STRING /
 * REGEX CHECKING plus `node --check` syntax parsing (documented, per issue
 * 0002 acceptance criterion 4 — "a lint rule or test", static checks are the
 * lint rule). The build FAILS (exit 1) on any of:
 *
 *  1.  JS syntax errors (`node --check`).
 *  2.  Any import / dynamic import / require / export statement token.
 *  3.  Any DOM query/interaction API token (querySelector*, getElementById,
 *      getElementsBy*, addEventListener, removeEventListener, innerHTML,
 *      outerHTML, insertAdjacentHTML, createElement, dispatchEvent,
 *      MutationObserver, .click(, attachShadow, localStorage,
 *      sessionStorage, document.cookie, eval, new Function).
 *  4.  Any `document.<prop>` or `navigator.<prop>` access other than
 *      `modelContext`, and any ASSIGNMENT to document/navigator.modelContext
 *      (the no-polyfill rule).
 *  5.  Any `window.<prop>` access other than `window.strideStoreBridge`
 *      (and any computed `window[...]` access at all).
 *  6.  fetch discipline: exactly ONE bare `fetch(` call site (the guarded
 *      storeFetch helper, whose '/api/store/' prefix guard literal must be
 *      present), and every quoted string literal containing '/api/' must
 *      start with '/api/store/'.
 *  7.  Missing any of the six tool registrations (name literals), missing
 *      `additionalProperties: false` on every schema object (7 expected:
 *      6 tool schemas + the nested preferences object), missing the three
 *      `annotations: { readOnlyHint: true }` literals, missing the exact
 *      `required:` literals that make idempotencyKey mandatory on all three
 *      mutations, or missing the bounded-field literals (ProductId pattern
 *      3-24 kebab-case, idempotencyKey pattern 8-64).
 *  8.  Missing IIFE + 'use strict' framing, or missing the two EXACT
 *      class-specific partial_failure warning strings from contracts §5.
 *
 * Output copy is byte-identical (verified by hash) and byte-stable on
 * re-run for an unchanged source.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SRC_PATH = join(ROOT, 'webmcp', 'tools.js');
export const OUT_PATH = join(ROOT, 'public', 'webmcp-tools.js');

const TOOL_NAMES = [
  'search_products',
  'compare_bikes',
  'get_cart',
  'add_to_cart',
  'update_cart_item',
  'remove_from_cart',
];

const WARNING_MUTATION =
  'STATE CHANGED — do not repeat this mutation with a new key. Retry with the SAME idempotencyKey, or call get_cart.';
const WARNING_READONLY =
  'UI sync failed; no state changed — safe to retry this call.';

const DOM_TOKENS = [
  'querySelector',
  'getElementById',
  'getElementsByClassName',
  'getElementsByTagName',
  'getElementsByName',
  'addEventListener',
  'removeEventListener',
  'innerHTML',
  'outerHTML',
  'insertAdjacentHTML',
  'createElement',
  'createTextNode',
  'dispatchEvent',
  'MutationObserver',
  '.click(',
  'attachShadow',
  'localStorage',
  'sessionStorage',
  'document.cookie',
];

function count(src, re) {
  const m = src.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'));
  return m ? m.length : 0;
}

/**
 * Pure validation over the tools.js source text (syntax check excluded —
 * that needs a file; see validateToolsFile). Returns an array of error
 * strings; empty means valid.
 */
export function validateToolsSource(src) {
  const errors = [];
  const err = (msg) => errors.push(msg);

  // 8. framing
  if (!/\(function \(\) \{\s*\n\s*'use strict';/.test(src)) {
    err("missing classic-script framing: IIFE `(function () {` with 'use strict'");
  }

  // 2. module syntax / require
  if (/(^|[^.\w])require\s*\(/.test(src)) err('forbidden token: require(');
  if (/(^|[;{}]\s*|\n)\s*import[\s({]/.test(src) || /\bimport\s*\(/.test(src)) {
    err('forbidden token: import statement or dynamic import');
  }
  if (/(^|[;{}]\s*|\n)\s*export\s/.test(src)) err('forbidden token: export statement');

  // 3. DOM / storage / eval tokens
  for (const token of DOM_TOKENS) {
    if (src.includes(token)) err(`forbidden DOM/storage API token: ${token}`);
  }
  if (/\beval\s*\(/.test(src)) err('forbidden token: eval(');
  if (/new\s+Function\s*\(/.test(src)) err('forbidden token: new Function(');

  // 4. document.* / navigator.* discipline + no-polyfill rule
  for (const m of src.matchAll(/\bdocument\s*\.\s*([A-Za-z_$][\w$]*)/g)) {
    if (m[1] !== 'modelContext') err(`forbidden document property access: document.${m[1]}`);
  }
  for (const m of src.matchAll(/\bnavigator\s*\.\s*([A-Za-z_$][\w$]*)/g)) {
    if (m[1] !== 'modelContext') err(`forbidden navigator property access: navigator.${m[1]}`);
  }
  if (/\bdocument\s*\[|\bnavigator\s*\[/.test(src)) {
    err('forbidden computed access on document/navigator');
  }
  if (/\bdocument\s*\.\s*modelContext\s*=/.test(src) || /\bnavigator\s*\.\s*modelContext\s*=/.test(src)) {
    err('polyfill forbidden: assignment to document/navigator.modelContext');
  }

  // 5. window.* discipline
  for (const m of src.matchAll(/\bwindow\s*\.\s*([A-Za-z_$][\w$]*)/g)) {
    if (m[1] !== 'strideStoreBridge') err(`forbidden window property access: window.${m[1]}`);
  }
  if (/\bwindow\s*\[/.test(src)) err('forbidden computed window[...] access');

  // 6. fetch discipline
  const fetchCalls = count(src, /\bfetch\s*\(/g);
  if (fetchCalls !== 1) {
    err(`expected exactly 1 bare fetch( call site (the guarded storeFetch helper), found ${fetchCalls}`);
  }
  if (!src.includes("path.indexOf('/api/store/') !== 0")) {
    err("missing the storeFetch '/api/store/' prefix guard literal");
  }
  for (const m of src.matchAll(/(['"`])([^'"`\n]*\/api\/[^'"`\n]*)\1/g)) {
    if (!m[2].startsWith('/api/store/')) err(`string literal fetches outside /api/store/: ${m[2]}`);
  }

  // 7. registrations, schemas, annotations, bounded fields
  for (const name of TOOL_NAMES) {
    if (!src.includes(`name: '${name}'`)) err(`missing tool registration: ${name}`);
  }
  const addlProps = count(src, /additionalProperties: false/g);
  if (addlProps < 7) {
    err(`expected >= 7 'additionalProperties: false' (6 tool schemas + preferences), found ${addlProps}`);
  }
  const annotations = count(src, /annotations: \{ readOnlyHint: true \}/g);
  if (annotations !== 3) {
    err(`expected exactly 3 'annotations: { readOnlyHint: true }' literals (the read-only tools), found ${annotations}`);
  }
  const requiredLiterals = [
    "required: ['ids']",
    "required: ['productId', 'idempotencyKey']",
    "required: ['cartItemId', 'quantity', 'idempotencyKey']",
    "required: ['cartItemId', 'idempotencyKey']",
  ];
  for (const lit of requiredLiterals) {
    if (!src.includes(lit)) err(`missing schema required-list literal: ${lit}`);
  }
  const boundedLiterals = [
    "pattern: '^[a-z0-9]+(-[a-z0-9]+)*$'", // ProductId
    "pattern: '^[A-Za-z0-9._-]+$'", // idempotencyKey
    'minLength: 8',
    'maxLength: 64', // idempotencyKey — must fit a plain UUID (36 chars)
    'minLength: 3',
    'maxLength: 24',
    'maxLength: 27', // cartItemId
  ];
  for (const lit of boundedLiterals) {
    if (!src.includes(lit)) err(`missing bounded-field literal: ${lit}`);
  }

  // 8. exact class-specific warning strings (contracts §5)
  if (!src.includes(WARNING_MUTATION)) err('missing exact mutation partial_failure warning string');
  if (!src.includes(WARNING_READONLY)) err('missing exact read-only partial_failure warning string');

  return errors;
}

/** Full validation of the file: node --check syntax + static source rules. */
export function validateToolsFile(path = SRC_PATH) {
  const errors = [];
  const check = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
  if (check.status !== 0) {
    errors.push(`syntax check failed (node --check):\n${check.stderr.trim()}`);
    return errors; // unparseable source: static checks would be noise
  }
  return errors.concat(validateToolsSource(readFileSync(path, 'utf8')));
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function main() {
  if (!existsSync(SRC_PATH)) {
    console.error(`webmcp:build FAILED — source not found: ${SRC_PATH}`);
    process.exit(1);
  }
  const errors = validateToolsFile(SRC_PATH);
  if (errors.length > 0) {
    console.error('webmcp:build FAILED — webmcp/tools.js violates its boundary rules:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const bytes = readFileSync(SRC_PATH);
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  const srcHash = sha256(bytes);
  if (!existsSync(OUT_PATH) || sha256(readFileSync(OUT_PATH)) !== srcHash) {
    writeFileSync(OUT_PATH, bytes);
  }
  const outHash = sha256(readFileSync(OUT_PATH));
  if (outHash !== srcHash) {
    console.error('webmcp:build FAILED — output is not byte-identical to source');
    process.exit(1);
  }
  console.log(`webmcp:build OK — public/webmcp-tools.js (${bytes.length} bytes, sha256 ${srcHash.slice(0, 12)}…)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
