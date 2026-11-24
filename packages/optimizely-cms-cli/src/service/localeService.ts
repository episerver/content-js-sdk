import ora from 'ora';
import chalk from 'chalk';
import type { paths } from './apiSchema/openapi-schema-types.js';
import type { ApiClient } from './cmsRestClient.js';

type Locale = paths['/locales']['post']['requestBody']['content']['application/json'];

/**
 * Derives display name from locale key (e.g., "en-US" -> "English (United States)")
 */
const deriveDisplayName = (key: string): string => {
  try {
    const locale = new Intl.DisplayNames(['en'], { type: 'language' });
    return locale.of(key) || key;
  } catch {
    return key;
  }
};

/**
 * Syncs locales from buildConfig to CMS via REST API; resolves to whether every locale synced
 */
export async function syncLocales(
  locale: string[],
  restClient: ApiClient,
): Promise<boolean> {
  if (!locale || !Array.isArray(locale) || locale.length === 0) {
    return true;
  }

  const spinner = ora('Syncing locales').start();

  // Fetch existing locales
  const listResponse = await restClient.GET('/locales');
  if (listResponse.error) {
    spinner.fail(chalk.red('Failed to fetch existing locales'));
    const error = listResponse.error;
    console.error(
      chalk.dim(
        `${error.status || ''} ${error.detail || error.title || 'Unknown error'}`,
      ),
    );
    return false;
  }

  const existingLocales = listResponse.data?.items || [];
  const existingKeys = new Set(existingLocales.map(l => l.key));

  // Categorize locales
  const toCreate = locale.filter(lang => !existingKeys.has(lang));
  const toEnable = locale.filter(lang => {
    const existing = existingLocales.find(l => l.key === lang);
    return existing && !existing.isEnabled;
  });
  const alreadyEnabled = locale.filter(lang => {
    const existing = existingLocales.find(l => l.key === lang);
    return existing && existing.isEnabled;
  });

  let createdCount = 0;
  for (const lang of toCreate) {
    const newLocale: Locale = {
      key: lang,
      displayName: deriveDisplayName(lang),
      isEnabled: true,
      routeSegment: lang.toLowerCase(),
    };

    const createResponse = await restClient.POST('/locales', {
      body: newLocale as any,
      bodySerializer: body => JSON.stringify(body),
    });

    if (createResponse.error) {
      const error = createResponse.error;
      spinner.warn(
        chalk.yellow(
          `Failed to create locale ${lang}: ${error.detail || error.title || 'Unknown error'}`,
        ),
      );
      if (error.errors?.length) {
        error.errors.forEach(err => {
          console.log(chalk.dim(`  - ${err.detail} (field: ${err.field})`));
        });
      }
    } else {
      createdCount++;
    }
  }

  // Enable disabled locales that are in config
  let enabledCount = 0;
  for (const lang of toEnable) {
    const patchResponse = await restClient.PATCH(`/locales/{key}`, {
      params: { path: { key: lang } },
      body: { isEnabled: true } as any,
      bodySerializer: body => JSON.stringify(body),
      headers: {
        'content-type': 'application/merge-patch+json',
      },
    });

    if (patchResponse.error) {
      const error = patchResponse.error;
      spinner.warn(
        chalk.yellow(
          `Failed to enable locale ${lang}: ${error.detail || error.title || 'Unknown error'}`,
        ),
      );
      if (error.errors?.length) {
        error.errors.forEach(err => {
          console.log(chalk.dim(`  - ${err.detail} (field: ${err.field})`));
        });
      }
    } else {
      enabledCount++;
    }
  }

  const failed = toCreate.length - createdCount + toEnable.length - enabledCount;

  spinner.succeed(
    chalk.green(
      `Locales synced: ${createdCount} created, ${enabledCount} enabled, ${alreadyEnabled.length} unchanged${failed > 0 ? `, ${failed} failed` : ''}`,
    ),
  );

  return failed === 0;
}
