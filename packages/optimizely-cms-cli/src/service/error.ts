import { Errors } from '@oclif/core';

/** Base class for all Errors that can happen in the CLI app */
export class OptimizelyCliError extends Error {
  //
}

const CLIError = Errors.CLIError;

export const credentialErrors = {
  InvalidCredentials: class InvalidCredentials extends CLIError {
    constructor() {
      super('The client credentials are invalid', {
        exit: 1,
      });
    }
  },
  MissingCredentials: class MissingCredentials extends CLIError {
    constructor() {
      super(
        'Credentials not provided. Get the Client ID and Secret from the CMS and define the environment variables `OPTIMIZELY_CMS_CLIENT_ID` and `OPTIMIZELY_CMS_CLIENT_SECRET`'
      );
    }
  },
};
