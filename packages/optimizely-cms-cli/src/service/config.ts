/** Utilities to access the stored configuration (credentials) */

import Conf from 'conf';
import { z } from 'zod';
import { credentialErrors } from './error.js';

const CmsSettingsSchema = z.record(
  z.string(),
  z.object({
    clientId: z.string(),
    clientSecret: z.string(),
  })
);

const SettingsSchema = z.object({
  cms: CmsSettingsSchema,
});

/** Configuration file format */
type Settings = z.infer<typeof SettingsSchema>;

/** Save the credentials of a specific URL */
export function saveCredentials(
  url: string,
  credentials: { clientId: string; clientSecret: string }
) {
  const normalizedUrl = new URL('/', url).toString();
  const conf = new Conf<Settings>({ projectName: 'optimizely' });

  // Get the object
  const obj = CmsSettingsSchema.parse(conf.get('cms', {}));

  obj[normalizedUrl] = credentials;
  conf.set('cms', obj);
}

/** Get all the instances saved in the configuration file */
export function getInstances(): string[] {
  const conf = new Conf<Settings>({ projectName: 'optimizely' });
  const result = [];

  for (const k in CmsSettingsSchema.parse(conf.get('cms'))) {
    result.push(k);
  }

  return result;
}

export function readCredentials(url?: string) {
  const conf = new Conf({ projectName: 'optimizely' });
  const obj = CmsSettingsSchema.safeParse(conf.get('cms', {}));

  if (!obj.success) {
    throw new credentialErrors.WrongFormat(conf);
  }

  if (Object.values(obj.data).length === 0) {
    return null;
  }

  // If the credentials has exactly one host, we can return it
  if (!url && Object.values(obj.data).length === 1) {
    return {
      url: Object.keys(obj.data)[0],
      ...Object.values(obj.data)[0],
    };
  }

  if (!url && Object.values(obj.data).length > 1) {
    throw new Error(
      'More than one credentials detected. Provide the --host flag or the OPTIMIZELY_HOST env var'
    );
  }

  const normalizedUrl = new URL('/', url).toString();

  if (obj.data[normalizedUrl]) {
    return {
      url: normalizedUrl,
      clientId: obj.data[normalizedUrl].clientId,
      clientSecret: obj.data[normalizedUrl].clientSecret,
    };
  }

  return null;
}
