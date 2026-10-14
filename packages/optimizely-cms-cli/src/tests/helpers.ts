import { vi, type Mock, type MockInstance } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import type { ManifestContentType } from '../utils/manifest.js';

type ApiResult = {
  data?: unknown;
  error?: unknown;
  status?: number;
  statusText?: string;
};

/** Builds an openapi-fetch style result: `{ data, error, response }` */
export const apiResponse = ({
  data,
  error,
  status = error ? 400 : 200,
  statusText,
}: ApiResult = {}) => ({
  data,
  error,
  response: { ok: status >= 200 && status < 300, status, statusText },
});

export type MockApiClient = Record<'GET' | 'POST' | 'PATCH' | 'DELETE', Mock>;

/** A REST client whose methods resolve an empty 200 response unless overridden */
export const mockApiClient = (): MockApiClient => ({
  GET: vi.fn().mockResolvedValue(apiResponse()),
  POST: vi.fn().mockResolvedValue(apiResponse()),
  PATCH: vi.fn().mockResolvedValue(apiResponse()),
  DELETE: vi.fn().mockResolvedValue(apiResponse()),
});

/** Makes a client method answer by request path, falling back to `fallback` */
export const respondByPath = (
  method: MockInstance,
  responses: Record<string, ReturnType<typeof apiResponse>>,
  fallback = apiResponse({ status: 404, error: { status: 404, title: 'Not Found' } }),
): MockInstance => method.mockImplementation(async (path: string) => responses[path] ?? fallback);

/** Thrown by the mocked `process.exit` so the command flow stops where the real one would */
export class ExitError extends Error {
  constructor(readonly code?: string | number | null) {
    super(`process.exit(${code})`);
  }
}

export const mockExit = () =>
  vi.spyOn(process, 'exit').mockImplementation(code => {
    throw new ExitError(code);
  });

/** Silences console output and returns the spies */
export const silenceConsole = () => ({
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
});

/** Everything a spy was called with, joined into plain (uncoloured) text */
export const printed = (spy: MockInstance) =>
  stripVTControlCharacters(spy.mock.calls.map(call => call.join(' ')).join('\n'));

const SPINNER_METHODS = ['start', 'succeed', 'fail', 'warn', 'info', 'stop'] as const;

type SpinnerMethod = (typeof SPINNER_METHODS)[number];

/** A chainable stand-in for an ora spinner, used from `vi.mock('ora', ...)` */
export const createSpinner = () => {
  const spinner: Record<string, unknown> = { text: '' };
  SPINNER_METHODS.forEach(method => (spinner[method] = vi.fn(() => spinner)));
  return spinner;
};

/** Plain-text messages passed to `method` across every spinner the mocked ora created */
export const spinnerMessages = (ora: unknown, method: SpinnerMethod) =>
  (ora as MockInstance).mock.results.flatMap(result =>
    (result.value[method] as MockInstance).mock.calls.map(call =>
      stripVTControlCharacters(String(call[0])),
    ),
  );

/** Builds a manifest content type with sensible defaults */
export const manifestContentType = (
  key: string,
  overrides: Partial<ManifestContentType> = {},
): ManifestContentType => ({
  key,
  displayName: key,
  baseType: '_component',
  isContract: false,
  properties: {},
  ...overrides,
});

/** Source for a component module exporting each definition as-is */
export const componentSource = (definitions: Record<string, unknown>[]) =>
  definitions
    .map((it, index) => `export const definition${index} = ${JSON.stringify(it)};`)
    .join('\n');

export const contentTypeDefinition = (key: string, overrides: Record<string, unknown> = {}) => ({
  __type: 'contentType',
  key,
  displayName: key,
  baseType: '_component',
  properties: {},
  ...overrides,
});

/** Writes `optimizely.config.mjs` plus extra files into `root`; returns the config path */
export const writeProject = async (
  root: string,
  config: unknown,
  files: Record<string, string> = {},
) => {
  const configPath = join(root, 'optimizely.config.mjs');
  const entries = Object.entries({
    'optimizely.config.mjs': `export default ${JSON.stringify(config)};`,
    ...files,
  });

  await Promise.all(
    entries.map(async ([name, content]) => {
      await mkdir(dirname(join(root, name)), { recursive: true });
      await writeFile(join(root, name), content);
    }),
  );

  return configPath;
};
