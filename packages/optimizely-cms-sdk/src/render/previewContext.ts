import { AsyncLocalStorage } from 'node:async_hooks';
import { PreviewParams } from '../graph';

type Context = {
  key?: string;
  loc?: string;
  edit: boolean;
  preview: boolean;
  preview_token?: string;
};

/** The context if nothing else is defined */
const defaultContext: Context = {
  edit: false,
  preview: false,
};

const asyncLocalStorage = new AsyncLocalStorage<Context>();

/** Gets context information from a Request */
function getContextFromParams(params: PreviewParams): Context {
  return {
    edit: params.ctx === 'edit',
    preview: params.preview_token !== undefined,
    preview_token: params.preview_token,
    key: params.key,
    loc: params.loc,
  };
}

/** Returns the current context. Use `runWithPreview` to set the context */
export function getContext(): Context {
  return {
    ...defaultContext,
    ...asyncLocalStorage.getStore(),
  };
}

/**
 * Runs `fn` with a preview context. Returns what is returned by `fn`
 *
 * @param params - Preview parameters to be included in the context
 * @param fn  - The execution context
 */
export function runWithPreview<T>(params: PreviewParams, fn: () => T) {
  return asyncLocalStorage.run(getContextFromParams(params), fn);
}
