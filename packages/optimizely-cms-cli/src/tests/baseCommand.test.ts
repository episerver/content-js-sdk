import { describe, test, expect, afterEach } from 'vitest';
import { Flags } from '@oclif/core';
import { BaseCommand } from '../baseCommand.js';

class RequiredFlagsCommand extends BaseCommand<typeof RequiredFlagsCommand> {
  static override flags = {
    name: Flags.string({ required: true }),
    version: Flags.string({ required: true }),
  };

  public async run() {
    return this.parse(RequiredFlagsCommand);
  }
}

const run = (...args: string[]) => RequiredFlagsCommand.run(args, import.meta.url);

describe('BaseCommand', () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  test('names the single missing required flag', async () => {
    await expect(run('--name', 'site')).rejects.toThrow('Missing required flag --version');
  });

  test('lists every missing required flag', async () => {
    await expect(run()).rejects.toThrow('Missing required flags: --name,--version');
  });

  test('accepts the inherited --host flag', async () => {
    const { flags } = await run('--name', 'site', '--version', '1', '--host', 'https://cms.example.com');

    expect(flags).toEqual({ name: 'site', version: '1', host: 'https://cms.example.com' });
  });

  test('passes other parse errors through unchanged', async () => {
    await expect(run('--name', 'site', '--version', '1', '--nope')).rejects.toThrow(
      'Nonexistent flag: --nope',
    );
  });
});
