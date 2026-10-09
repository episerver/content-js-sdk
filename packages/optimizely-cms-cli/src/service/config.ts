/** Utilities to access the stored configuration (credentials) */

import Conf from 'conf';
import { z } from 'zod';
import { credentialErrors, hostingErrors } from './error.js';

const CmsSettingsSchema = z.record(
  z.string(),
  z.object({
    clientId: z.string(),
    clientSecret: z.string(),
  }),
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
  const { OPTIMIZELY_CMS_CLIENT_ID, OPTIMIZELY_CMS_CLIENT_SECRET } = process.env;

  if (OPTIMIZELY_CMS_CLIENT_ID && OPTIMIZELY_CMS_CLIENT_SECRET) {
    return {
      clientId: OPTIMIZELY_CMS_CLIENT_ID,
      clientSecret: OPTIMIZELY_CMS_CLIENT_SECRET,
    };
  }

  throw new credentialErrors.MissingCredentials();
}

const HOSTING_ENV_VARS = {
  projectId: 'OPTIMIZELY_DXP_PROJECT_ID',
  clientKey: 'OPTIMIZELY_DXP_CLIENT_KEY',
  clientSecret: 'OPTIMIZELY_DXP_CLIENT_SECRET',
} as const;

/** Front-end hosting (DXP) deployment credentials */
export type HostingCredentials = Record<keyof typeof HOSTING_ENV_VARS, string>;

/** Read the front-end hosting deployment credentials from environment variables */
export function readHostingCredentials(): HostingCredentials {
  const missing = Object.values(HOSTING_ENV_VARS).filter(envVar => !process.env[envVar]);

  if (missing.length > 0) throw new hostingErrors.MissingHostingCredentials(missing);

  return Object.fromEntries(
    Object.entries(HOSTING_ENV_VARS).map(([key, envVar]) => [key, process.env[envVar]]),
  ) as HostingCredentials;
}
