/**
 * Everything a form field derives from its content and its current value.
 *
 * The value itself, and the "has it been touched" flag, stay with the framework
 * binding — they are the only genuinely stateful parts of a field.
 *
 * @module
 */

import {
  getErrorMessages,
  getFieldName,
  isFieldRequired,
  toValidators,
  validateField,
  type Validator,
} from '../../forms/validation.js';
import { getElementIds } from './elementId.js';

/** The element properties a field reads. Every form field content type has them. */
export type FormFieldContent = {
  SubmissionFieldName?: string | null;
  Label?: string | null;
  Validators?: unknown;
  PredefinedValue?: string | null;
};

export type DefineFormFieldOptions = {
  /** The element's content. Name, validators and initial value are read from it. */
  content?: FormFieldContent & Record<string, unknown>;
  /** Overrides the name derived from `SubmissionFieldName` / `Label`. */
  name?: string;
  /** Overrides the validators read from `Validators`. */
  validators?: Validator[];
  /** Overrides the initial value read from `PredefinedValue`. */
  defaultValue?: string;
};

export type FormFieldDefinition = {
  name: string;
  validators: Validator[];
  initialValue: string;
  /** Every id dependency rules may target this field by. */
  elementIds: string[];
};

/** Reads a field's identity out of its content, applying any overrides. */
export function defineFormField({
  content,
  name: nameOverride,
  validators: validatorsOverride,
  defaultValue,
}: DefineFormFieldOptions): FormFieldDefinition {
  const field = content ?? {};

  return {
    name: nameOverride ?? getFieldName(field),
    validators: validatorsOverride ?? toValidators(field.Validators),
    initialValue: defaultValue ?? field.PredefinedValue ?? '',
    elementIds: getElementIds(content),
  };
}

export type FormFieldState = {
  errors: string[];
  hasErrors: boolean;
  showErrors: boolean;
  isRequired: boolean;
  errorId: string | undefined;
};

/**
 * Validates the current value and decides whether the visitor should see the result.
 *
 * Errors stay hidden until the field has been touched or the form has been
 * submitted, and a field hidden by a dependency rule never shows any.
 */
export function computeFieldState(
  definition: FormFieldDefinition,
  context: { value: string; isTouched: boolean; attemptedSubmit: boolean; isVisible: boolean },
): FormFieldState {
  const { name, validators } = definition;
  const { value, isTouched, attemptedSubmit, isVisible } = context;

  const errors = getErrorMessages(validateField(value, validators));
  const hasErrors = errors.length > 0;
  const showErrors = isVisible && (isTouched || attemptedSubmit) && hasErrors;

  return {
    errors,
    hasErrors,
    showErrors,
    isRequired: isFieldRequired(validators),
    errorId: showErrors ? `${name}-error` : undefined,
  };
}

/**
 * The attributes for the `<input>` / `<textarea>` (minus the handlers) and for
 * the element listing the messages.
 */
export function buildFieldProps(
  definition: FormFieldDefinition,
  state: FormFieldState,
  value: string,
) {
  return {
    fieldProps: {
      id: definition.name,
      name: definition.name,
      value,
      required: state.isRequired,
      'aria-invalid': state.showErrors,
      'aria-describedby': state.errorId,
    },
    errorProps: {
      id: `${definition.name}-error`,
      role: 'alert' as const,
    },
  };
}
