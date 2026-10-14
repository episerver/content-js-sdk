import { describe, expect, test } from 'vitest';
import {
  type BaseValidator,
  type Validator,
  VALIDATION_PATTERNS,
  extractErrorMessage,
  extractValidatorType,
  getErrorMessages,
  getFieldName,
  getHtmlValidationAttributes,
  getSelectionOptions,
  isFieldRequired,
  toValidators,
  validateField,
} from '../validation.js';

const validator = (type: string, extra: Partial<BaseValidator> = {}): BaseValidator => ({
  type,
  model: { message: `${type} failed` },
  ...extra,
});

/** Whether `value` passes a single validator. */
const passes = (value: string, check: Validator) => validateField(value, [check])[0].isValid;

describe('validateField', () => {
  test('returns no results without validators', () => {
    expect(validateField('anything')).toEqual([]);
    expect(validateField('anything', [])).toEqual([]);
  });

  test('returns one result per validator, carrying the validator', () => {
    const required = validator('RequireValidator');
    const email = validator('EmailValidator');

    expect(validateField('', [required, email])).toEqual([
      { validator: required, isValid: false },
      { validator: email, isValid: true },
    ]);
  });

  test.each(['RequireValidator', 'RequiredValidator'])('%s rejects empty and whitespace-only values', type => {
    expect(passes('', validator(type))).toBe(false);
    expect(passes('   ', validator(type))).toBe(false);
    expect(passes('x', validator(type))).toBe(true);
  });

  test.each([
    ['EmailValidator', ['a@b.co', ''], ['a@b', 'a b@c.d', 'plain']],
    ['IntegerValidator', ['42', '-7', ''], ['4.2', 'abc', '1e3']],
    ['PositiveIntegerValidator', ['0', '42', ''], ['-1', '4.2']],
    ['DecimalValidator', ['4.2', '-0.5', '7', ''], ['4.', '.5', 'abc']],
    ['UrlValidator', ['https://example.com/path', 'mailto:a@b.co', ''], ['example.com', 'not a url']],
  ])('%s', (type, valid, invalid) => {
    valid.forEach(value => expect(passes(value, validator(type)), value).toBe(true));
    invalid.forEach(value => expect(passes(value, validator(type)), value).toBe(false));
  });

  describe('RegularExpressionValidator', () => {
    const type = 'RegularExpressionValidator';

    test('matches against jsPattern in preference to pattern', () => {
      const check = validator(type, { jsPattern: '^[a-z]+$', pattern: '^\\d+$' });

      expect(passes('abc', check)).toBe(true);
      expect(passes('123', check)).toBe(false);
    });

    test('falls back to pattern', () => {
      expect(passes('123', validator(type, { pattern: '^\\d+$' }))).toBe(true);
      expect(passes('abc', validator(type, { pattern: '^\\d+$' }))).toBe(false);
    });

    test('an invalid pattern fails the value rather than throwing', () => {
      expect(passes('abc', validator(type, { jsPattern: '[' }))).toBe(false);
    });

    test('passes an empty value, a validator without a pattern, and a simplified validator', () => {
      expect(passes('', validator(type, { jsPattern: '^x$' }))).toBe(true);
      expect(passes('abc', validator(type))).toBe(true);
      expect(passes('abc', { type, errorMessage: 'bad' })).toBe(true);
    });
  });

  test('an unknown validator type always passes', () => {
    expect(passes('', validator('CaptchaValidator'))).toBe(true);
  });
});

describe('extractErrorMessage', () => {
  test('reads errorMessage from a simplified validator and model.message otherwise', () => {
    expect(extractErrorMessage({ type: 'x', errorMessage: 'simple' })).toBe('simple');
    expect(extractErrorMessage(validator('x', { model: { message: 'full' } }))).toBe('full');
  });

  test('is empty when the model is missing', () => {
    expect(extractErrorMessage({ type: 'x' } as unknown as Validator)).toBe('');
  });
});

describe('extractValidatorType', () => {
  test('lower-cases the type and folds requiredvalidator into requirevalidator', () => {
    expect(extractValidatorType(validator('EmailValidator'))).toBe('emailvalidator');
    expect(extractValidatorType(validator('RequiredValidator'))).toBe('requirevalidator');
    expect(extractValidatorType(validator('REQUIREVALIDATOR'))).toBe('requirevalidator');
  });
});

describe('getErrorMessages', () => {
  test('returns the messages of failed validators only, in order', () => {
    const errors = validateField('not-an-email', [
      validator('RequireValidator'),
      validator('EmailValidator', { model: { message: 'Enter an email' } }),
      { type: 'IntegerValidator', errorMessage: 'Enter a number' },
    ]);

    expect(getErrorMessages(errors)).toEqual(['Enter an email', 'Enter a number']);
  });
});

describe('isFieldRequired', () => {
  test('is true when any validator is a required validator, under either name', () => {
    expect(isFieldRequired([validator('EmailValidator'), validator('RequiredValidator')])).toBe(true);
    expect(isFieldRequired([validator('RequireValidator')])).toBe(true);
  });

  test('is false without a required validator or without validators', () => {
    expect(isFieldRequired([validator('EmailValidator')])).toBe(false);
    expect(isFieldRequired()).toBe(false);
  });
});

describe('getHtmlValidationAttributes', () => {
  test('is empty without validators', () => {
    expect(getHtmlValidationAttributes()).toEqual({});
  });

  test('maps required, email and regex validators to native attributes', () => {
    expect(
      getHtmlValidationAttributes([
        validator('RequiredValidator'),
        validator('EmailValidator'),
        validator('RegularExpressionValidator', { jsPattern: '^a', pattern: '^b' }),
      ]),
    ).toEqual({ required: true, type: 'email', pattern: '^a' });
  });

  test('uses pattern when jsPattern is absent', () => {
    expect(
      getHtmlValidationAttributes([validator('RegularExpressionValidator', { pattern: '^b' })]),
    ).toEqual({ pattern: '^b' });
  });

  test('adds nothing for numeric, url, unknown, pattern-less or simplified regex validators', () => {
    expect(
      getHtmlValidationAttributes([
        validator('IntegerValidator'),
        validator('PositiveIntegerValidator'),
        validator('DecimalValidator'),
        validator('UrlValidator'),
        validator('CaptchaValidator'),
        validator('RegularExpressionValidator'),
        { type: 'RegularExpressionValidator', errorMessage: 'bad' },
      ]),
    ).toEqual({});
  });
});

describe('getFieldName', () => {
  test('prefers SubmissionFieldName, then Label, then an empty string', () => {
    expect(getFieldName({ SubmissionFieldName: 'email', Label: 'Email' })).toBe('email');
    expect(getFieldName({ SubmissionFieldName: '', Label: 'Email' })).toBe('Email');
    expect(getFieldName({ SubmissionFieldName: null, Label: null })).toBe('');
  });
});

describe('toValidators', () => {
  test('passes an array through and turns anything else into an empty list', () => {
    const validators = [validator('EmailValidator')];

    expect(toValidators(validators)).toBe(validators);
    expect(toValidators(null)).toEqual([]);
    expect(toValidators('[]')).toEqual([]);
    expect(toValidators({ type: 'EmailValidator' })).toEqual([]);
  });
});

describe('getSelectionOptions', () => {
  const options = [
    { label: 'Red', value: 'red', selected: true },
    { label: 'Blue', value: 'blue' },
  ];

  test('returns an array as is', () => {
    expect(getSelectionOptions({ Options: options })).toBe(options);
  });

  test('parses a JSON string holding an array', () => {
    expect(getSelectionOptions({ Options: JSON.stringify(options) })).toEqual(options);
  });

  test.each([
    ['invalid JSON', '[{'],
    ['JSON that is not an array', '{"label":"Red"}'],
    ['a missing value', undefined],
    ['a number', 3],
  ])('returns an empty list for %s', (_label, value) => {
    expect(getSelectionOptions({ Options: value })).toEqual([]);
  });
});

describe('VALIDATION_PATTERNS', () => {
  test('anchor the whole value', () => {
    expect(VALIDATION_PATTERNS.integer.test('12a')).toBe(false);
    expect(VALIDATION_PATTERNS.positiveInteger.test('a12')).toBe(false);
    expect(VALIDATION_PATTERNS.decimal.test('1.2.3')).toBe(false);
    expect(VALIDATION_PATTERNS.email.test('a@b.co extra')).toBe(false);
  });
});
