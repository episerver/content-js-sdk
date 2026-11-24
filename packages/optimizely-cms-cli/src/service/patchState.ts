import * as path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import chalk from 'chalk';
import { z } from 'zod';
import { readEnvCredentials } from './config.js';
import { resolveHost, type ApiClient } from './cmsRestClient.js';
import { fetchManifest } from './manifestService.js';
import { hashManifest } from '../utils/normalizeManifest.js';
import type { StoredItem } from '../utils/patchStatus.js';

const StoredItemSchema = z.object({
  local: z.string(),
  server: z.string(),
}) satisfies z.ZodType<StoredItem>;
const InstanceStateSchema = z.object({
  updatedAt: z.string().optional(),
  items: z.record(z.string(), StoredItemSchema),
  // application key → hash of the application
  applications: z.record(z.string(), z.string()).optional(),
  // keys of the content items and the locales last synced; the syncs only add, never change
  content: z.array(z.string()).optional(),
  locales: z.array(z.string()).optional(),
});
const PatchStateSchema = z.object({
  version: z.literal(1),
  instances: z.record(z.string(), InstanceStateSchema),
});

type PatchState = z.infer<typeof PatchStateSchema>;

/** What patch remembers about one CMS instance */
export type InstanceState = z.infer<typeof InstanceStateSchema>;

/** Hashes to record after a push or an in-sync check */
export type StateUpdate = {
  local: Record<string, string>;
  server: Record<string, string>;
  /** item ids to store with their current local and server hashes */
  record: string[];
  /** item ids to forget */
  drop?: string[];
  applications?: Record<string, string>;
  content?: string[];
  locales?: string[];
};

const EMPTY_STATE: PatchState = { version: 1, instances: {} };
const EMPTY_INSTANCE: InstanceState = { items: {} };

const stateFilePath = (configFilePath: string) =>
  path.join(path.dirname(configFilePath), '.optimizely', 'patch-state.json');

// SaaS instances share the gateway host, so the client ID tells them apart
const instanceKey = (host?: string) =>
  `${resolveHost(host)}|${readEnvCredentials().clientId}`;

const isMissingFile = (error: unknown) =>
  (error as NodeJS.ErrnoException)?.code === 'ENOENT';

/** Reads the state file; undefined when it is missing, null when it cannot be used */
const readStateFile = async (filePath: string): Promise<PatchState | null | undefined> => {
  try {
    const parsed = PatchStateSchema.safeParse(JSON.parse(await readFile(filePath, 'utf8')));
    return parsed.success ? parsed.data : null;
  } catch (error) {
    return isMissingFile(error) ? undefined : null;
  }
};

const recordedItems = ({ local, server, record }: StateUpdate) =>
  Object.fromEntries(
    record
      .filter(id => local[id] && server[id])
      .map(id => [id, { local: local[id], server: server[id] } satisfies StoredItem]),
  );

const mergeInstance = (instance: InstanceState, update: StateUpdate): InstanceState => {
  const dropped = new Set(update.drop);
  const kept = Object.entries(instance.items).filter(([id]) => !dropped.has(id));

  return {
    updatedAt: new Date().toISOString(),
    items: { ...Object.fromEntries(kept), ...recordedItems(update) },
    applications: update.applications ?? instance.applications,
    content: update.content ?? instance.content,
    locales: update.locales ?? instance.locales,
  };
};

/** Reads what patch remembers about the current CMS instance; empty when nothing is stored. */
export const readPatchState = async (
  configFilePath: string,
  host?: string,
): Promise<InstanceState> => {
  const filePath = stateFilePath(configFilePath);
  const state = await readStateFile(filePath);

  if (state === null)
    console.warn(chalk.yellow(`Ignoring unreadable patch state in ${filePath}`));

  return state?.instances[instanceKey(host)] ?? EMPTY_INSTANCE;
};

/** Merges an update into the stored state of the current CMS instance, keeping other instances. */
export const savePatchState = async (
  configFilePath: string,
  host: string | undefined,
  update: StateUpdate,
) => {
  const filePath = stateFilePath(configFilePath);
  const state = (await readStateFile(filePath)) ?? EMPTY_STATE;
  const key = instanceKey(host);
  const instances = {
    ...state.instances,
    [key]: mergeInstance(state.instances[key] ?? EMPTY_INSTANCE, update),
  };

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify({ version: 1, instances }, null, 2)}\n`);
};

/**
 * Saves the state for the current instance. Without `serverHashes` the server copy is read
 * back, as needed after an upload. Only warns on failure: the CMS is already up to date.
 */
export const recordState = async (
  configFilePath: string,
  host: string | undefined,
  restClient: ApiClient,
  update: Omit<StateUpdate, 'server'>,
  serverHashes?: Record<string, string>,
) => {
  try {
    await savePatchState(configFilePath, host, {
      ...update,
      server: serverHashes ?? hashManifest(await fetchManifest(restClient)),
    });
  } catch (error) {
    console.warn(
      chalk.yellow(
        `Could not record the state for config patch: ${(error as Error).message}`,
      ),
    );
  }
};
