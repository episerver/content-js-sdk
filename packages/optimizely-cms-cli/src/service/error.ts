import { Errors } from '@oclif/core';
import Conf from 'conf';

/** Base class for all Errors that can happen in the CLI app */
export class OptimizelyCliError extends Error {
  //
}

const CLIError = Errors.CLIError;

export const credentialErrors = {
  WrongFormat: class WrongFormat extends CLIError {
    constructor(conf: Conf) {
      super('The credentials file is malformed', {
        exit: 1,
        suggestions: [`Delete the file '${conf.path}' and try again`],
      });
    }
  },

  NoCredentialsFound: class NoCredentialsFound extends CLIError {
    constructor() {
      super('No credentials found in the file', {
        exit: 1,
        suggestions: [`Run 'optimizely-experimental login'`],
      });
    }
  },
};
