/**
 * The form runtime: field registration, validation, dependency rules, steps and
 * submission, as one observable store.
 *
 * Everything a framework binding has to supply is a way to re-render on
 * `subscribe` and a `FormData` on submit.
 *
 * @module
 */

import { createStore, type ReadableStore, type Store } from '../store.js';
import { dropShadowedBlanks } from './formData.js';

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export type SubmissionState = {
  status: FormStatus;
  /** Whatever the failing submit threw, if anything. */
  error: unknown;
  /**
   * The failure's message, ready to render.
   *
   * Only set when a `submitHandler` threw an `Error`. A failed built-in POST
   * leaves this undefined, so a template rendering it cannot put `Failed to
   * fetch` or a bare status code in front of a visitor.
   */
  errorMessage: string | undefined;
  formSuccess: boolean;
  formError: boolean;
  isSubmitting: boolean;
};

export type SubmissionStore = ReadableStore<SubmissionState> & {
  /**
   * Sets the status. An error passed alongside `'error'` becomes available as
   * `error` and `errorMessage`; any other status clears it.
   */
  setStatus(status: FormStatus, error?: unknown): void;
};

const submissionState = (status: FormStatus, error: unknown): SubmissionState => ({
  status,
  error,
  errorMessage: error instanceof Error ? error.message : undefined,
  formSuccess: status === 'success',
  formError: status === 'error',
  isSubmitting: status === 'submitting',
});

/**
 * Holds a form's submission status.
 *
 * Separate from the controller because the status is usually read outside the
 * form — an alert above it, a button in a footer.
 */
export function createSubmissionStore(): SubmissionStore {
  const store = createStore(submissionState('idle', undefined));

  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    // Status and error move together, so a retry cannot leave the previous
    // attempt's message on screen next to a 'submitting' or 'success' state.
    setStatus: (status, error) =>
      store.setState(() => submissionState(status, status === 'error' ? error : undefined)),
  };
}

/**
 * Sends a validated form.
 *
 * Resolving means success: the caller resets the fields, returns to the first
 * step and scrolls, exactly as it does after its own POST. Throwing means
 * failure, and an `Error`'s message reaches the submission store's `errorMessage`.
 *
 * Runs in the browser. Anything needing a credential belongs in a server action
 * or a route handler called from here.
 *
 * @param formData The form's current values.
 * @param context.action The container's Submit URL, for a handler that wants it.
 */
export type FormSubmitHandler = (
  formData: FormData,
  context: { action: string },
) => Promise<unknown>;

/** The DOM work the controller does. Overridable so the controller is testable headless. */
export type FormEffects = {
  /** Scrolls the element with this id into view. */
  scrollToElementId(elementId: string): void;
  /** Brings a field on screen and puts the caret in it. */
  revealField(element: HTMLElement): void;
};

const domEffects: FormEffects = {
  scrollToElementId(elementId) {
    if (typeof document === 'undefined') return;
    document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  revealField(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus();
  },
};

/** The step rules navigation consults. The binding owns the field values they read. */
export type StepRules = {
  getJumpTarget(stepIds: string[]): string | null;
  isStepVisible(stepIds: string[]): boolean;
};

/** The parts a binding may change without tearing the controller down. */
export type FormControllerSettings = {
  /** Where the built-in POST goes. Ignored when `submitHandler` is given. */
  action?: string;
  /** Replaces the built-in POST. Everything around it is unchanged. */
  submitHandler?: FormSubmitHandler;
  /** One entry per step, holding the ids rules may name that step by. */
  stepIds?: string[][];
  /** Consulted by `nextStep`. Without it, steps advance in order. */
  stepRules?: StepRules;
  scrollToOnSuccess?: string | false;
  scrollToOnError?: string | false;
};

export type FormControllerOptions = FormControllerSettings & {
  submission: SubmissionStore;
  effects?: Partial<FormEffects>;
};

export type FormState = {
  currentStepIndex: number;
  attemptedSubmit: boolean;
  hasAnyErrors: boolean;
  /**
   * Increments when the form is reset. Fields watch it and return to their
   * initial value: the inputs are controlled, so a DOM `form.reset()` clears the
   * markup but leaves framework state holding the old values.
   */
  resetToken: number;
  /**
   * The field to bring on screen, or `null`. Set when submitting finds an invalid
   * field; the binding calls {@linkcode FormController.revealPendingField} once the
   * step holding it has been rendered.
   */
  fieldToReveal: string | null;
};

type RegisteredField = {
  ref: HTMLElement | null;
  validate: () => boolean;
  stepIndex?: number;
};

export type FormController = ReadableStore<FormState> & {
  registerField(
    name: string,
    ref: HTMLElement | null,
    validate: () => boolean,
    stepIndex?: number,
  ): void;
  unregisterField(name: string): void;
  setFieldError(name: string, hasError: boolean): void;
  getFieldRef(name: string): HTMLElement | null;
  /** The step a field was registered on, or `undefined` if it is not in a step. */
  getFieldStepIndex(name: string): number | undefined;
  /**
   * Runs the registered fields' validators.
   *
   * @param options.stepIndex Validate only the fields on this step. Omit to
   *   validate the whole form, including steps that are not on screen.
   * @returns The names of the fields that failed, in page order. Empty means
   *   everything validated passed.
   */
  validateAllFields(options?: { stepIndex?: number }): string[];
  /**
   * Merges into the current settings; keys left out keep their value, keys set
   * to `undefined` clear it. A binding re-renders with new props far more often
   * than a form is mounted, and an inline `submitHandler` is a new function each
   * time, so these are read at use rather than captured at creation.
   */
  update(settings: Partial<FormControllerSettings>): void;
  setAttemptedSubmit(value: boolean): void;
  nextStep(): void;
  prevStep(): void;
  /** Performs the deferred scroll-and-focus, if one is pending. */
  revealPendingField(): void;
  /** Bumps {@linkcode FormState.resetToken} so fields return to their initial value. */
  resetFields(): void;
  /** Returns to the first step, clears the fields and forgets the last attempt. */
  reset(): void;
  /**
   * Validates, then sends.
   *
   * @param formData The values to send. Blanks shadowing an answer given on
   *   another step are dropped first.
   * @param form The form element, reset on success so uncontrolled inputs clear.
   */
  submit(formData: FormData, form?: { reset(): void }): Promise<void>;
};

export function createFormController(options: FormControllerOptions): FormController {
  const { submission } = options;
  const effects: FormEffects = { ...domEffects, ...options.effects };

  let settings: FormControllerSettings = options;

  // Where each `nextStep` came from, so `prevStep` retraces jumps and skipped steps.
  let stepHistory: number[] = [];

  const store: Store<FormState> = createStore<FormState>({
    currentStepIndex: 0,
    attemptedSubmit: false,
    hasAnyErrors: false,
    resetToken: 0,
    fieldToReveal: null,
  });

  // Held outside the snapshot: a field re-registers on every validity flip, and
  // publishing that would re-render the whole form each keystroke.
  const fields = new Map<string, RegisteredField>();
  const fieldsWithErrors = new Set<string>();

  // Page order, remembered separately from the field map. A field re-registers
  // every time its validity flips, and unregistering deletes it first, so map
  // insertion order drifts away from the order the fields appear in.
  const fieldOrder = new Map<string, number>();
  let nextOrder = 0;

  const publishErrorCount = () =>
    store.setState(state => ({ ...state, hasAnyErrors: fieldsWithErrors.size > 0 }));

  const setAttemptedSubmit = (attemptedSubmit: boolean) =>
    store.setState(state => ({ ...state, attemptedSubmit }));

  const scrollToElement = (elementId: string | false | undefined) => {
    if (elementId) effects.scrollToElementId(elementId);
  };

  const controller: FormController = {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,

    registerField(name, ref, validate, stepIndex) {
      if (!fieldOrder.has(name)) fieldOrder.set(name, nextOrder++);
      fields.set(name, { ref, validate, stepIndex });
    },

    unregisterField(name) {
      fields.delete(name);
      fieldsWithErrors.delete(name);
      publishErrorCount();
    },

    setFieldError(name, hasError) {
      if (hasError) fieldsWithErrors.add(name);
      else fieldsWithErrors.delete(name);
      publishErrorCount();
    },

    getFieldRef: name => fields.get(name)?.ref ?? null,

    getFieldStepIndex: name => fields.get(name)?.stepIndex,

    validateAllFields({ stepIndex } = {}) {
      const invalid = [...fields.entries()]
        .filter(([, field]) => stepIndex === undefined || field.stepIndex === stepIndex)
        .filter(([, field]) => !field.validate())
        .map(([name]) => name);

      const orderOf = (name: string) => fieldOrder.get(name) ?? 0;
      return invalid.sort((a, b) => orderOf(a) - orderOf(b));
    },

    update(next) {
      settings = { ...settings, ...next };
    },

    setAttemptedSubmit,

    nextStep() {
      // Only the current step is on screen, so only its fields can be corrected here.
      // Later steps are validated when the form is finally submitted.
      const current = store.getSnapshot().currentStepIndex;

      const invalid = controller.validateAllFields({ stepIndex: current });

      if (invalid.length > 0) {
        setAttemptedSubmit(true);
        revealFirstInvalid(invalid);
        return;
      }

      stepHistory.push(current);
      store.setState(state => ({
        ...state,
        attemptedSubmit: false,
        currentStepIndex: followingStep(current),
      }));
    },

    prevStep() {
      const previous = stepHistory.pop() ?? 0;
      store.setState(state => ({ ...state, attemptedSubmit: false, currentStepIndex: previous }));
    },

    revealPendingField() {
      const { fieldToReveal } = store.getSnapshot();
      if (fieldToReveal === null) return;

      const field = controller.getFieldRef(fieldToReveal);
      if (field) effects.revealField(field);
      store.setState(state => ({ ...state, fieldToReveal: null }));
    },

    resetFields() {
      store.setState(state => ({ ...state, resetToken: state.resetToken + 1 }));
    },

    reset() {
      stepHistory = [];
      store.setState(state => ({
        ...state,
        resetToken: state.resetToken + 1,
        attemptedSubmit: false,
        currentStepIndex: 0,
      }));
    },

    async submit(formData, form) {
      if (submission.getSnapshot().isSubmitting) return;

      const {
        action,
        submitHandler,
        scrollToOnSuccess = 'form-alert',
        scrollToOnError,
      } = settings;

      const invalid = controller.validateAllFields();

      if (invalid.length > 0) {
        setAttemptedSubmit(true);
        revealFirstInvalid(invalid);
        scrollToElement(scrollToOnError);
        return;
      }

      setAttemptedSubmit(false);
      submission.setStatus('submitting');

      try {
        const data = dropShadowedBlanks(formData);

        if (submitHandler) {
          await submitHandler(data, { action: action ?? '' });
        } else {
          const response = await fetch(action ?? '', { method: 'POST', body: data });

          // Thrown rather than branched, so both routes share one failure path.
          if (!response.ok) {
            throw new Error(`Submission failed with status ${response.status}`);
          }
        }

        submission.setStatus('success');
        // A DOM reset only clears uncontrolled inputs; fields driven by the field
        // controller hold their value in framework state and need the token.
        form?.reset();
        controller.reset();
        scrollToElement(scrollToOnSuccess);
      } catch (error) {
        // Only a handler's own error was written for a visitor to read. The
        // built-in POST would offer `Failed to fetch` or a bare status code.
        submission.setStatus('error', submitHandler ? error : undefined);
        scrollToElement(scrollToOnError);
      }
    },
  };

  // A satisfied jump rule wins; otherwise the next visible step. The last step is
  // never skipped, so the form always has somewhere to submit from.
  function followingStep(current: number): number {
    const { stepIds = [], stepRules } = settings;
    const last = Math.max(0, stepIds.length - 1);

    const currentIds = stepIds[current] ?? [];
    const jumpTarget = currentIds.length ? stepRules?.getJumpTarget(currentIds) : null;
    const jumpIndex = jumpTarget ? stepIds.findIndex(ids => ids.includes(jumpTarget)) : -1;
    if (jumpIndex >= 0) return jumpIndex;

    const isVisible = (index: number) => stepRules?.isStepVisible(stepIds[index] ?? []) ?? true;
    const candidates = Array.from(
      { length: Math.max(0, last - current - 1) },
      (_, offset) => current + 1 + offset,
    );

    return candidates.find(isVisible) ?? last;
  }

  // Fields register in page order, so the first entry is the earliest one on the page.
  function revealFirstInvalid(invalidFieldNames: string[]) {
    const name = invalidFieldNames[0];

    // Submitting validates every step, so the offending field may be on one
    // that isn't showing. Scrolling to a `display: none` element does nothing,
    // which leaves the visitor on a form that silently refuses to send.
    const step = controller.getFieldStepIndex(name);

    store.setState(state => ({
      ...state,
      currentStepIndex: step ?? state.currentStepIndex,
      fieldToReveal: name,
    }));
  }

  return controller;
}
