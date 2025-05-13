import { Command, Flags, Interfaces, Errors } from '@oclif/core';
export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)['baseFlags'] & T['flags']
>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

/**
 * Handle errors related to invalid flags (missing flags or too many of them)
 */
function handleFlagsError(err: any) {
  const flagsSettings = err?.parse?.input?.flags;

  // Flags given by the user
  const userFlags = err?.parse?.output?.flags;

  if (flagsSettings && userFlags) {
    const requiredFlags: string[] = Object.values(flagsSettings)
      .filter((f: any) => f.required)
      .map((f: any) => f.name);

    if (requiredFlags.length > 0) {
      const givenFlags = Object.keys(userFlags);
      const missingFlags = requiredFlags.filter((f) => !givenFlags.includes(f));

      if (missingFlags.length === 1) {
        throw new Error(`Missing required flag --${missingFlags[0]}`);
      }

      if (missingFlags.length > 1) {
        const missingFlagsString = missingFlags.map((f) => `--${f}`).join(',');
        throw new Error('Missing required flags: ' + missingFlagsString);
      }
    }
  }
}

/** Base class with flags and common error handling for all commands */
export abstract class BaseCommand<T extends typeof Command> extends Command {
  // add the --json flag
  static enableJsonFlag = true;

  // define flags that can be inherited by any command that extends BaseCommand
  static baseFlags = {
    host: Flags.string({
      description:
        'CMS instance URL. For example: `my-instance.cms.optimizely.com`',
    }),
  };

  protected flags!: Flags<T>;
  protected args!: Args<T>;

  protected async catch(err: any & { exitCode?: number }): Promise<any> {
    handleFlagsError(err);

    return super.catch(err);
  }

  protected async finally(_: Error | undefined): Promise<any> {
    // called after run and catch regardless of whether or not the command errored
    return super.finally(_);
  }
}
