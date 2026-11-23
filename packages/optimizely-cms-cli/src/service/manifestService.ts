import * as path from 'node:path';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { pathToFileURL } from 'node:url';
import chalk from 'chalk';
import ora from 'ora';
import type { Client } from 'openapi-fetch';
import type { components, paths } from './apiSchema/openapi-schema-types.js';
import { API_VERSION } from './cmsRestClient.js';
import {
  findMetaData,
  logList,
  readFromPath,
  normalizePropertyGroups,
  validateApplications,
} from './utils.js';
import { mapContentToManifest } from '../mapper/contentToPackage.js';
import { contractToManifest, validateContentAreaConstraints } from '../utils/mapping.js';

type ApiClient = Client<paths>;
type ImportResult =
  paths['/manifest']['post']['responses']['200']['content']['application/json'];
type ProblemDetails = components['schemas']['ProblemDetails'];

const MANIFEST_MEDIA_TYPE = `application/vnd.optimizely.cms.${API_VERSION}.manifest+json`;

// explicit types are required for a bare call to narrow the caller's types
const exitWithMessage: (message: string) => never = message => {
  console.error(chalk.red(message));
  process.exit(1);
};

const exitWithProblem: (problem: ProblemDetails) => never = problem => {
  console.error(
    chalk.red(
      `Error ${problem.status}: ${problem.title || 'Unknown error'} (${problem.code || 'N/A'})`,
    ),
  );
  if (problem.detail) console.error(chalk.dim(problem.detail));

  problem.errors?.forEach((error, index) => {
    console.error(`  - ERROR ${index + 1}`);
    console.error(chalk.dim(`      [DETAIL] ${error.detail}`));
    console.error(chalk.dim(`      [FIELD]  ${error.field}\n`));
  });

  process.exit(1);
};

const displayNamesOf = (items: { displayName: string }[]) =>
  items.map(it => it.displayName);

const exitIfConfigMissing = async (configFilePath: string) => {
  try {
    await access(configFilePath, constants.R_OK);
  } catch {
    console.error(chalk.red(`Configuration file not found: ${configFilePath}`));
    console.error(chalk.dim(`Make sure the file exists and is readable.`));
    process.exit(1);
  }
};

const exitOnConstraintErrors = (errors: string[]) => {
  if (errors.length === 0) return;

  console.error(
    chalk.red(
      `\nInvalid content type configuration (${errors.length} ${errors.length === 1 ? 'issue' : 'issues'} found):`,
    ),
  );
  for (const error of errors) {
    console.error(chalk.red(`  ✖ ${error}`));
  }
  console.error(
    chalk.dim(
      '\n  Resolve the issues above and run the command again. Nothing was pushed to the CMS.\n',
    ),
  );
  process.exit(1);
};

/**
 * Loads and validates a configuration file and maps it to the manifest shape,
 * returning the manifest plus the global settings synced outside it.
 */
export const buildManifest = async (configFilePath: string, { log = true } = {}) => {
  await exitIfConfigMissing(configFilePath);

  const { componentPaths, propertyGroups, applications, content, locale } =
    await readFromPath(pathToFileURL(configFilePath).href);

  if (!componentPaths || !Array.isArray(componentPaths)) {
    console.error(
      chalk.red('Invalid configuration: "components" field must be an array'),
    );
    process.exit(1);
  }

  // the component globs are relative to the config file
  const configDirectory = pathToFileURL(path.dirname(configFilePath)).href;
  const { contentTypes, displayTemplates, contracts } = await findMetaData(
    componentPaths,
    configDirectory,
    { log },
  );

  exitOnConstraintErrors(validateContentAreaConstraints(contentTypes).errors);

  const normalizedPropertyGroups =
    propertyGroups ? normalizePropertyGroups(propertyGroups) : [];

  const validatedApplications =
    applications ? validateApplications(applications, content) : [];

  if (log) {
    logList('Property Groups found', displayNamesOf(normalizedPropertyGroups));
    logList('Applications found', displayNamesOf(validatedApplications));
  }

  return {
    manifest: {
      contentTypes: mapContentToManifest(contentTypes).concat(
        contracts.map(contractToManifest),
      ),
      displayTemplates,
      propertyGroups: normalizedPropertyGroups,
    },
    applications: validatedApplications,
    content,
    locale,
  };
};

/** Uploads a manifest and returns the import result; exits when the request fails. */
export const uploadManifest = async (
  restClient: ApiClient,
  manifest: unknown,
  force = false,
): Promise<ImportResult> => {
  const spinner = ora('Uploading configuration file').start();

  const response = await restClient.POST('/manifest', {
    headers: {
      accept: 'application/json',
      'content-type': MANIFEST_MEDIA_TYPE,
    },
    body: manifest as any,
    params: {
      header: {
        'cms-ignore-data-loss-warnings': force,
      },
    },
  });

  if (response.error) {
    spinner.fail(chalk.red(' Error'));
    exitWithProblem(response.error);
  }

  spinner.succeed(chalk.green('Configuration file uploaded'));

  if (!response.data) exitWithMessage('The server did not respond with any content');

  return response.data;
};

const fetchErrorMessage = (
  error?: ProblemDetails & { message?: string },
  response?: Response,
) => {
  const status = error?.status ?? response?.status;
  const title = error?.title ?? error?.message ?? response?.statusText;
  const detail = error?.detail;

  return [
    'Failed to fetch manifest from CMS',
    status ? chalk.dim(` (status ${status})`) : '',
    title ? `: ${chalk.yellow(title)}` : '',
    detail ? chalk.dim(` - ${detail}`) : '',
  ].join('');
};

/** Fetches the content types, display templates and property groups stored in the CMS. */
export const fetchManifest = async (restClient: ApiClient, { includeReadOnly = false } = {}) => {
  const { data, error, response } = await restClient.GET('/manifest', {
    params: {
      query: {
        sections: ['contentTypes', 'displayTemplates', 'propertyGroups'],
        ...(includeReadOnly ? { includeReadOnly } : {}),
      },
    },
  });

  if (error || (response && !response.ok)) throw new Error(fetchErrorMessage(error, response));

  return data;
};
