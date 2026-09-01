'use client';

import {
  ReactNode,
  useRef,
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { FormValidationProvider, useFormValidation } from './FormValidationContext.js';
import { useFormSubmission } from './FormSubmissionProvider.js';
import { FormRulesProvider } from './FormRulesContext.js';
import { ExperienceNode } from '../../infer.js';

type FormStepsContextType = {
  currentStepIndex: number;
  nextStep: () => void;
  prevStep: () => void;
};

const FormStepsContext = createContext<FormStepsContextType | undefined>(undefined);

export function useFormSteps() {
  const context = useContext(FormStepsContext);
  if (!context) {
    return { currentStepIndex: 0, nextStep: () => {}, prevStep: () => {} };
  }
  return context;
}

/**
 * Sends a validated form.
 *
 * Resolving means success: the caller resets the fields, returns to the first
 * step and scrolls, exactly as it does after its own POST. Throwing means
 * failure, and an `Error`'s message reaches `useFormSubmission().errorMessage`.
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

type FormWrapperProps = {
  /** Where the built-in POST goes. Ignored when `submitHandler` is given. */
  action?: string;
  /** Replaces the built-in POST. Everything around it is unchanged. */
  submitHandler?: FormSubmitHandler;
  children: ReactNode;
  scrollToOnSuccess?: string | false;
  scrollToOnError?: string | false;
  steps?: ExperienceNode[];
  rules?: unknown;
};

function scrollToElement(elementId: string | false | undefined) {
  if (elementId) {
    document
      .getElementById(elementId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function FormWrapperContent({
  action,
  submitHandler,
  children,
  scrollToOnSuccess = 'form-alert',
  scrollToOnError,
  steps = [],
  rules,
}: FormWrapperProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [fieldToReveal, setFieldToReveal] = useState<string | null>(null);
  const {
    setAttemptedSubmit,
    validateAllFields,
    getFieldRef,
    getFieldStepIndex,
    resetFields,
  } = useFormValidation();
  const { setStatus } = useFormSubmission();
  const formRef = useRef<HTMLFormElement>(null);

  // An empty action POSTs to the page itself, which answers 405 and surfaces as
  // a generic failure. Usually means the container's Submit URL was left unset.
  if (process.env.NODE_ENV !== 'production' && !action && !submitHandler) {
    console.warn(
      'FormWrapper has no `action` and no `submitHandler`, so the form will post ' +
        "to the current page. Set the form container's Submit URL in the CMS, or " +
        'pass a `submitHandler`.',
    );
  }

  // Fields register in render order, so the first entry is the earliest one on the page.
  const revealFirstInvalid = useCallback(
    (invalidFieldNames: string[]) => {
      const name = invalidFieldNames[0];

      // Submitting validates every step, so the offending field may be on one
      // that isn't showing. Scrolling to a `display: none` element does nothing,
      // which leaves the visitor on a form that silently refuses to send.
      const step = getFieldStepIndex(name);
      if (step !== undefined) setCurrentStepIndex(step);

      setFieldToReveal(name);
    },
    [getFieldStepIndex],
  );

  // Deferred to an effect so the step above has been shown before we scroll.
  useEffect(() => {
    if (fieldToReveal === null) return;

    const field = getFieldRef(fieldToReveal);
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field?.focus();
    setFieldToReveal(null);
  }, [fieldToReveal, getFieldRef]);

  const lastStepIndex = Math.max(0, steps.length - 1);

  const nextStep = useCallback(() => {
    // Only the current step is on screen, so only its fields can be corrected here.
    // Later steps are validated when the form is finally submitted.
    setAttemptedSubmit(true);
    const invalid = validateAllFields({ stepIndex: currentStepIndex });

    if (invalid.length > 0) {
      revealFirstInvalid(invalid);
      return;
    }

    setAttemptedSubmit(false);
    setCurrentStepIndex(prev => Math.min(lastStepIndex, prev + 1));
  }, [
    currentStepIndex,
    lastStepIndex,
    setAttemptedSubmit,
    validateAllFields,
    revealFirstInvalid,
  ]);

  const prevStep = useCallback(() => {
    setAttemptedSubmit(false);
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  }, [setAttemptedSubmit]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    setAttemptedSubmit(true);

    const invalid = validateAllFields();

    if (invalid.length > 0) {
      revealFirstInvalid(invalid);
      scrollToElement(scrollToOnError);
      return;
    }

    setAttemptedSubmit(false);
    setStatus('submitting');

    try {
      const formData = new FormData(formRef.current!);

      if (submitHandler) {
        await submitHandler(formData, { action: action ?? '' });
      } else {
        const response = await fetch(action ?? '', {
          method: 'POST',
          body: formData,
        });

        // Thrown rather than branched, so both routes share one failure path.
        if (!response.ok) {
          throw new Error(`Submission failed with status ${response.status}`);
        }
      }

      setStatus('success');
      // `form.reset()` only clears uncontrolled inputs; fields driven by
      // `useFormField` hold their value in React state and need the token.
      formRef.current?.reset();
      resetFields();
      setAttemptedSubmit(false);
      setCurrentStepIndex(0);
      scrollToElement(scrollToOnSuccess);
    } catch (error) {
      // Only a handler's own error was written for a visitor to read. The
      // built-in POST would offer `Failed to fetch` or a bare status code.
      setStatus('error', submitHandler ? error : undefined);
      scrollToElement(scrollToOnError);
    }
  };

  return (
    <FormRulesProvider rules={Array.isArray(rules) ? rules : undefined}>
      <FormStepsContext.Provider value={{ currentStepIndex, nextStep, prevStep }}>
        <form ref={formRef} onSubmit={handleSubmit}>
          {children}
        </form>
      </FormStepsContext.Provider>
    </FormRulesProvider>
  );
}

export default function FormWrapper(props: FormWrapperProps) {
  return (
    <FormValidationProvider>
      <FormWrapperContent {...props} />
    </FormValidationProvider>
  );
}
