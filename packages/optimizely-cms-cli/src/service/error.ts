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
  DeploymentApiError: class DeploymentApiError extends CLIError {
    constructor(action: string, status: number, errors: string[] = []) {
      super(
        [`Failed to ${action} (HTTP ${status})`, ...errors.map(error => `  - ${error}`)].join('\n'),
      );
    }
  },
  DeploymentFailed: class DeploymentFailed extends CLIError {
    constructor(id: string, errors: string[] = []) {
      super(
        [
          `Deployment ${id} failed. See the DXP management portal for the full log`,
          ...errors.map(error => `  - ${error}`),
        ].join('\n'),
      );
    }
  },
  DeploymentTimeout: class DeploymentTimeout extends CLIError {
    constructor(id: string, minutes: number) {
      super(
        `Deployment ${id} did not finish within ${minutes} minutes. It may still be running; check the DXP management portal or raise --timeout`,
      );
    }
  },
  ForbiddenHostingCredentials: class ForbiddenHostingCredentials extends CLIError {
    constructor(errors: string[] = []) {
      super(
        [
          'The front-end hosting credentials have no access to this project or environment. Check the environment name against the DXP management portal, or create an API key there with the target environment selected',
          ...errors.map(error => `  - ${error}`),
        ].join('\n'),
      );
    }
  },
  InvalidPackageName: class InvalidPackageName extends CLIError {
    constructor(name: string) {
      super(
        `Invalid package name "${name}". Use only letters, numbers and hyphens, or set it with --name`,
      );
    }
  },
  InvalidProject: class InvalidProject extends CLIError {
    constructor(problems: string[]) {
      super(
        `The project cannot be deployed to front-end hosting:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`,
      );
    }
  },
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
  PackageExists: class PackageExists extends CLIError {
    constructor(name: string) {
      super(`A package named ${name} was already uploaded. Deploy again with a different --version`);
    }
  },
};
