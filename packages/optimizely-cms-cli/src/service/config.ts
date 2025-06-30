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

/** Get all the instances saved in the configuration file */
export function getInstances(): string[] {
  const conf = new Conf<Settings>({ projectName: 'optimizely' });
  const result = [];

  for (const k in CmsSettingsSchema.parse(conf.get('cms'))) {
    result.push(k);
  }

  return result;
}

export function readEnvCredentials() {
  const { OPTIMIZELY_CMS_CLIENT_ID, OPTIMIZELY_CMS_CLIENT_SECRET } =
    process.env;

  if (OPTIMIZELY_CMS_CLIENT_ID && OPTIMIZELY_CMS_CLIENT_SECRET) {
    return {
      clientId: OPTIMIZELY_CMS_CLIENT_ID,
      clientSecret: OPTIMIZELY_CMS_CLIENT_SECRET,
    };
  }

  throw new credentialErrors.MissingCredentials();
}
