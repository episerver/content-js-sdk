import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { readFromPath } from '../service/utils.js';
import { printed, silenceConsole } from './helpers.js';

describe('readFromPath', () => {
  let tempDir: string;
  let consoleSpies: ReturnType<typeof silenceConsole>;

  const writeConfig = async (source: string) => {
    const configPath = join(tempDir, 'optimizely.config.mjs');
    await writeFile(configPath, source);
    return pathToFileURL(configPath).href;
  };

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cli-read-config-'));
    consoleSpies = silenceConsole();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tempDir, { recursive: true, force: true });
  });

  test('maps the default export onto the config fields', async () => {
    const config = {
      components: ['./components/**/*.ts'],
      propertyGroups: [{ key: 'seo' }],
      applications: [{ key: 'site' }],
      content: [{ key: 'home' }],
      locale: ['en'],
    };

    await expect(readFromPath(await writeConfig(`export default ${JSON.stringify(config)};`)))
      .resolves.toEqual({
        componentPaths: config.components,
        propertyGroups: config.propertyGroups,
        applications: config.applications,
        content: config.content,
        locale: config.locale,
      });
  });

  test('logs and rethrows when the config file throws on import', async () => {
    const configUrl = await writeConfig(`throw new Error('Broken config');`);

    await expect(readFromPath(configUrl)).rejects.toThrow('Broken config');
    expect(printed(consoleSpies.error)).toContain('Failed to read configuration file');
    expect(printed(consoleSpies.error)).toContain('Broken config');
  });
});
