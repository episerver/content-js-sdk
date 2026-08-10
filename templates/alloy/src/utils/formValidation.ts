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

const isSimplifiedValidator = (validator: Validator): validator is SimplifiedValidator =>
  'errorMessage' in validator;

const isBaseValidator = (validator: Validator): validator is BaseValidator =>
  'model' in validator;

export const extractErrorMessage = (validator: Validator): string =>
  isSimplifiedValidator(validator) ? validator.errorMessage : validator.model?.message ?? '';

export const extractValidatorType = (validator: Validator): string => {
  const type = validator.type.toLowerCase();
  if (type === 'requirevalidator' || type === 'requiredvalidator') return 'requirevalidator';
  return type;
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
        isValid = value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;

      case 'integervalidator':
        isValid = value.length === 0 || /^-?\d+$/.test(value);
        break;

      case 'positiveintegervalidator':
        isValid = value.length === 0 || /^\d+$/.test(value);
        break;

      case 'decimalvalidator':
        isValid = value.length === 0 || /^-?\d+(\.\d+)?$/.test(value);
        break;

      case 'urlvalidator':
        if (value.length === 0) {
          isValid = true;
        } else {
          try {
            new URL(value);
            isValid = true;
          } catch {
            isValid = false;
          }
        }
        break;

      case 'regularexpressionvalidator':
        if (value.length === 0) {
          isValid = true;
        } else if (isBaseValidator(validator) && (validator.jsPattern || validator.pattern)) {
          const pattern = validator.jsPattern || validator.pattern;
          if (pattern) {
            try {
              const regex = new RegExp(pattern);
              isValid = regex.test(value);
            } catch {
              isValid = false;
            }
          }
        }
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

  validators.forEach(validator => {
    const type = extractValidatorType(validator);

    if (type === 'requirevalidator') {
      attrs.required = true;
    } else if (type === 'emailvalidator') {
      attrs.type = 'email';
    } else if (type === 'regularexpressionvalidator' && isBaseValidator(validator)) {
      const pattern = validator.jsPattern ?? validator.pattern;
      if (pattern) attrs.pattern = pattern;
    }
  });

  return attrs;
};

export const getFieldName = (
  submissionFieldName: string | null | undefined,
  label: string | null | undefined,
): string => submissionFieldName || label || '';
