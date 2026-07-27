type Validator = {
  type: string;
  errorMessage: string;
};

export type FormFieldError = {
  validator: Validator;
  isValid: boolean;
};

export const validateField = (value: string, validators?: Validator[]): FormFieldError[] => {
  if (!validators || validators.length === 0) return [];

  return validators.map(validator => {
    let isValid = true;

    switch (validator.type.toLowerCase()) {
      case 'requirevalidator':
        isValid = value.trim().length > 0;
        break;
      case 'emailvalidator':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case 'integervalidator':
        isValid = /^-?\d+$/.test(value);
        break;
      case 'decimalvalidator':
        isValid = /^-?\d+(\.\d+)?$/.test(value);
        break;
      case 'urlvalidator':
        try {
          new URL(value);
          isValid = true;
        } catch {
          isValid = value.length === 0;
        }
        break;
      default:
        isValid = true;
    }

    return { validator, isValid };
  });
};

export const getErrorMessages = (errors: FormFieldError[]): string[] =>
  errors.filter(error => !error.isValid).map(error => error.validator.errorMessage);

export const isFieldRequired = (validators?: Validator[]): boolean =>
  (validators ?? []).some(v => v.type.toLowerCase() === 'requirevalidator');
