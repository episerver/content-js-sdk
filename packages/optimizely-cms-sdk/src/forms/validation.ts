export type ValidatorType =
  | 'requirevalidator'
  | 'emailvalidator'
  | 'integervalidator'
  | 'positiveintegervalidator'
  | 'decimalvalidator'
  | 'urlvalidator'
  | 'regularexpressionvalidator';

export type ValidatorModel = {
  message: string;
  validationCssClass?: string | null;
  additionalAttributes?: Record<string, string>;
};

export type BaseValidator = {
  type: string;
  description?: string | null;
  model: ValidatorModel;
  jsPattern?: string;
  pattern?: string;
};

export type SimplifiedValidator = {
  type: string;
  errorMessage: string;
};

export type Validator = BaseValidator | SimplifiedValidator;

export type FormFieldError = {
  validator: Validator;
  isValid: boolean;
};

export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  integer: /^-?\d+$/,
  positiveInteger: /^\d+$/,
  decimal: /^-?\d+(\.\d+)?$/,
} as const;

const isSimplifiedValidator = (validator: Validator): validator is SimplifiedValidator =>
  'errorMessage' in validator;

const isBaseValidator = (validator: Validator): validator is BaseValidator =>
  'model' in validator;

export const extractErrorMessage = (validator: Validator): string =>
  isSimplifiedValidator(validator) ? validator.errorMessage : validator.model?.message ?? '';

export const extractValidatorType = (validator: Validator): ValidatorType => {
  const type = validator.type.toLowerCase();
  if (type === 'requirevalidator' || type === 'requiredvalidator') return 'requirevalidator';
  return type as ValidatorType;
};

export const validateField = (value: string, validators?: Validator[]): FormFieldError[] => {
  if (!validators || validators.length === 0) return [];

  return validators.map(validator => {
    let isValid = true;
    const validatorType = extractValidatorType(validator);

    switch (validatorType) {
      case 'requirevalidator':
        isValid = value.trim().length > 0;
        break;

      case 'emailvalidator':
        isValid = value.length === 0 || VALIDATION_PATTERNS.email.test(value);
        break;

      case 'integervalidator':
        isValid = value.length === 0 || VALIDATION_PATTERNS.integer.test(value);
        break;

      case 'positiveintegervalidator':
        isValid = value.length === 0 || VALIDATION_PATTERNS.positiveInteger.test(value);
        break;

      case 'decimalvalidator':
        isValid = value.length === 0 || VALIDATION_PATTERNS.decimal.test(value);
        break;

      case 'urlvalidator':
        isValid = value.length === 0 || (() => {
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        })();
        break;

      case 'regularexpressionvalidator':
        isValid = value.length === 0 || (() => {
          if (!isBaseValidator(validator)) return true;
          const pattern = validator.jsPattern ?? validator.pattern;
          if (!pattern) return true;
          try {
            return new RegExp(pattern).test(value);
          } catch {
            return false;
          }
        })();
        break;

      default:
        isValid = true;
    }

    return { validator, isValid };
  });
};

export const getErrorMessages = (errors: FormFieldError[]): string[] =>
  errors.filter(error => !error.isValid).map(error => extractErrorMessage(error.validator));

export const isFieldRequired = (validators?: Validator[]): boolean =>
  (validators ?? []).some(v => extractValidatorType(v) === 'requirevalidator');

export const getHtmlValidationAttributes = (validators?: Validator[]): Record<string, string | boolean> => {
  if (!validators) return {};

  const attrs: Record<string, string | boolean> = {};
  const typeMap: Record<ValidatorType, (v: Validator) => Record<string, string | boolean> | null> = {
    requirevalidator: () => ({ required: true }),
    emailvalidator: () => ({ type: 'email' }),
    integervalidator: () => ({}),
    positiveintegervalidator: () => ({}),
    decimalvalidator: () => ({}),
    urlvalidator: () => ({}),
    regularexpressionvalidator: v => {
      if (!isBaseValidator(v)) return null;
      const pattern = v.jsPattern ?? v.pattern;
      return pattern ? { pattern } : null;
    },
  };

  validators.forEach(validator => {
    const type = extractValidatorType(validator);
    const typeAttrs = typeMap[type]?.(validator);
    if (typeAttrs) Object.assign(attrs, typeAttrs);
  });

  return attrs;
};

export const getFieldName = (field: {
  SubmissionFieldName?: string | null;
  Label?: string | null;
}): string => field.SubmissionFieldName || field.Label || '';

/**
 * Reads a `Validators` property.
 *
 * The CMS models it as free-form JSON, so it arrives as `unknown` and every
 * caller would otherwise repeat the same unchecked cast.
 */
export const toValidators = (value: unknown): Validator[] =>
  Array.isArray(value) ? (value as Validator[]) : [];

/** One choice in a choice or selection element. */
export type SelectionOption = {
  label: string;
  value: string;
  selected?: boolean;
};

/** Reads the `Options` property of a choice or selection element. */
export const getSelectionOptions = (field: { Options?: unknown }): SelectionOption[] =>
  Array.isArray(field.Options) ? (field.Options as SelectionOption[]) : [];
