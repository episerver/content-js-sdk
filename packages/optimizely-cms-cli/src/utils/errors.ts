import chalk from 'chalk';

enum IncomingErrorType {
  DataLossWarning,
  Unknown,
}

type PackageImportError = { section?: string | null; message?: string | null };

function getErrorMessageType({
  section,
  message,
}: PackageImportError): IncomingErrorType {
  if (section === 'contentTypes' && message?.includes('ignoreDataLossWarnings'))
    return IncomingErrorType.DataLossWarning;
  return IncomingErrorType.Unknown;
}

const ignoreDataLossWarningsMessage =
  "Use the 'ignoreDataLossWarnings' option to apply the changes anyway.";
const useForceFlagMessage =
  "Use the '--force' flag to apply the changes anyway.";

function getErrorMessage(
  errorType: IncomingErrorType,
  message: string,
): string {
  switch (errorType) {
    case IncomingErrorType.DataLossWarning:
      return message?.replace(
        ignoreDataLossWarningsMessage,
        useForceFlagMessage,
      );
    default:
      return message ?? '';
  }
}

export function translateErrorMessage(importError: PackageImportError): string {
  const errorMessageType = getErrorMessageType(importError);
  return getErrorMessage(errorMessageType, importError.message ?? '');
}

type ImportResult = {
  readonly outcomes?: readonly { message?: string }[];
  readonly errors?: readonly PackageImportError[];
};

/** Prints the outcomes and errors of a manifest import; exits when there are errors. */
export const reportImportResult = (result: ImportResult) => {
  if (result.outcomes && result.outcomes.length > 0) {
    console.log(chalk.cyan.bold('\nOutcomes:'));
    for (const outcome of result.outcomes) {
      console.log(chalk.dim('  -'), chalk.blue(outcome.message));
    }
  }

  if (result.errors && result.errors.length > 0) {
    console.log(chalk.red.bold('\nErrors:'));
    for (const error of result.errors) {
      console.log(chalk.dim('  -'), chalk.red(translateErrorMessage(error)));
    }
    process.exit(1);
  }
};
