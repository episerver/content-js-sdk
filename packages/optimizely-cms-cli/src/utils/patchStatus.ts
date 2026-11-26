/** Hashes of an item recorded after it was last pushed or found in sync */
export type StoredItem = { local: string; server: string };

export type ConflictReason = 'bothChanged' | 'deletedOnServer' | 'noState';

export type ItemStatus =
  | {
      id: string;
      status:
        | 'unchanged'
        | 'changed'
        | 'new'
        | 'outdated'
        | 'inSync'
        | 'removed'
        | 'deletedOnServer'
        | 'gone';
    }
  | { id: string; status: 'conflict'; reason: ConflictReason };

type Hashes = Record<string, string>;

const classifyWithState = (
  id: string,
  stored: StoredItem,
  local?: string,
  server?: string,
): ItemStatus => {
  if (local === undefined)
    return { id, status: server === undefined ? 'gone' : 'removed' };

  const localChanged = local !== stored.local;

  if (server === undefined)
    return localChanged ?
        { id, status: 'conflict', reason: 'deletedOnServer' }
      : { id, status: 'deletedOnServer' };

  const serverChanged = server !== stored.server;

  if (!localChanged && !serverChanged) return { id, status: 'unchanged' };
  if (local === server) return { id, status: 'inSync' };
  if (localChanged && serverChanged)
    return { id, status: 'conflict', reason: 'bothChanged' };

  return { id, status: localChanged ? 'changed' : 'outdated' };
};

const classifyWithoutState = (id: string, local: string, server?: string): ItemStatus =>
  server === undefined ? { id, status: 'new' }
  : local === server ? { id, status: 'inSync' }
  : { id, status: 'conflict', reason: 'noState' };

/**
 * Compares local and server item hashes with the ones stored after the last push.
 * Server items that are neither local nor stored belong to someone else and are left out.
 */
export const classifyItems = (
  local: Hashes,
  server: Hashes,
  stored: Record<string, StoredItem>,
): ItemStatus[] =>
  [...new Set([...Object.keys(local), ...Object.keys(stored)])]
    .sort()
    .map(id =>
      stored[id] ?
        classifyWithState(id, stored[id], local[id], server[id])
      : classifyWithoutState(id, local[id], server[id]),
    );

/** Matches item statuses that are one of the given kinds, for use with `filter`. */
export const hasStatus =
  (...wanted: ItemStatus['status'][]) =>
  (status: ItemStatus) =>
    wanted.includes(status.status);
