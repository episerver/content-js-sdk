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
