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
        'Credentials not provided. Get the Client ID and Secret from the CMS and define the environment variables `OPTIMIZELY_CMS_CLIENT_ID` and `OPTIMIZELY_CMS_CLIENT_SECRET`',
      );
    }
  },
};

export const hostingErrors = {
  InvalidHostingCredentials: class InvalidHostingCredentials extends CLIError {
    constructor() {
      super(
        'The front-end hosting credentials were rejected. Check `OPTIMIZELY_DXP_CLIENT_KEY` and `OPTIMIZELY_DXP_CLIENT_SECRET` against the API tab of the DXP management portal',
        { exit: 1 },
      );
    }
  },
  MissingHostingCredentials: class MissingHostingCredentials extends CLIError {
    constructor(missing: string[]) {
      super(
        `Front-end hosting credentials not provided. Define ${missing.map((name) => `\`${name}\``).join(', ')} with the values from the API tab of the DXP management portal. These are not the CMS credentials (\`OPTIMIZELY_CMS_CLIENT_ID\` / \`OPTIMIZELY_CMS_CLIENT_SECRET\`)`,
      );
    }
  },
};
