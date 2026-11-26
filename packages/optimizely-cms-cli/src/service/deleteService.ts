import ora from 'ora';
import chalk from 'chalk';
import type { ApiClient } from './cmsRestClient.js';
import {
  itemLabel,
  parseItemId,
  type ManifestSection,
} from '../utils/normalizeManifest.js';

/** What happened to one item: deleted, not in the CMS to begin with, or refused */
export type DeleteOutcome = 'deleted' | 'missing' | 'failed';

type DeleteResponse = {
  response: Response;
  error?: {
    code?: string | null;
    title?: string | null;
    detail?: string | null;
  };
};

type DeleteOptions = {
  // when the caller named the items itself, a missing one is a failure, not a warning
  missingIsFailure?: boolean;
};

// display templates point at content types, which point at property groups
const DELETE_ORDER: ManifestSection[] = [
  'displayTemplates',
  'contentTypes',
  'propertyGroups',
];

const DELETERS: Record<
  ManifestSection,
  (client: ApiClient, key: string) => Promise<DeleteResponse>
> = {
  contentTypes: (client, key) =>
    client.DELETE('/contenttypes/{key}', { params: { path: { key } } }),
  displayTemplates: (client, key) =>
    client.DELETE('/displaytemplates/{key}', { params: { path: { key } } }),
  propertyGroups: (client, key) =>
    client.DELETE('/propertygroups/{key}', { params: { path: { key } } }),
};

const failureReason = ({ response, error }: DeleteResponse) => {
  if (response.status === 409 && error?.code === 'DependencyConflict')
    return 'it still has content; delete the content first';
  if (response.status === 409) return 'it is in use';
  if (!error) return 'an unexpected error occurred';

  const detail = error.detail ? ` (${error.detail})` : '';
  return `error ${response.status}: ${error.title || 'Unknown error'}${detail}`;
};

const deleteItem = async (
  client: ApiClient,
  id: string,
  { missingIsFailure = false }: DeleteOptions,
): Promise<DeleteOutcome> => {
  const { section, key } = parseItemId(id);
  const label = itemLabel(id);
  const spinner = ora(`Deleting ${label}`).start();
  const result = await DELETERS[section](client, key);

  if (result.response.ok) {
    spinner.succeed(chalk.green(`Deleted ${label}`));
    return 'deleted';
  }

  if (result.response.status === 404) {
    const message = `${label} is not in the CMS`;
    if (missingIsFailure) spinner.fail(chalk.red(message));
    else spinner.warn(chalk.yellow(message));
    return 'missing';
  }

  spinner.fail(chalk.red(`Could not delete ${label}: ${failureReason(result)}`));
  return 'failed';
};

const deleteOrder = (id: string) => DELETE_ORDER.indexOf(parseItemId(id).section);

/**
 * Deletes manifest items one at a time, display templates before the content types they
 * belong to and property groups last; resolves to the outcome per item id.
 */
export const deleteItems = (
  client: ApiClient,
  ids: string[],
  options: DeleteOptions = {},
): Promise<Record<string, DeleteOutcome>> =>
  [...ids]
    .sort((a, b) => deleteOrder(a) - deleteOrder(b))
    .reduce(
      async (acc, id) => ({
        ...(await acc),
        [id]: await deleteItem(client, id, options),
      }),
      Promise.resolve({} as Record<string, DeleteOutcome>),
    );
