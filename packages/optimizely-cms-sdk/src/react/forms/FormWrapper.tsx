'use client';

import {
  ReactNode,
  useRef,
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useMemo,
} from 'react';
import { FormValidationProvider, useFormValidation } from './FormValidationContext.js';
import { useFormSubmission } from './FormSubmissionProvider.js';
import { FormRulesProvider, useFormRules } from './FormRulesContext.js';
import { getElementIds } from './getElementId.js';
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

/**
 * Drops the blank entry when a field name appears on more than one step and at
 * least one of them was filled in.
 *
 * Every step stays in the DOM, so a name reused across steps reaches `FormData`
 * once per step and the blank ones would otherwise shadow the real answer.
 */
function dropShadowedBlanks(formData: FormData): FormData {
  const answered = new Set(
    [...formData].filter(([, value]) => value !== '').map(([name]) => name),
  );

  [...formData]
    .filter(([name, value]) => value === '' && answered.has(name))
    .forEach(([name]) => {
      const kept = formData.getAll(name).filter(value => value !== '');
      formData.delete(name);
      kept.forEach(value => formData.append(name, value));
    });

  return formData;
}

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
}: Omit<FormWrapperProps, 'rules'>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const stepHistoryRef = useRef<number[]>([]);
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

  const { getJumpTarget, isStepVisible } = useFormRules();
  const rulesRef = useRef({ getJumpTarget, isStepVisible });
  rulesRef.current = { getJumpTarget, isStepVisible };

  const stepIds = useMemo(
    () => steps.map(step => getElementIds({ ...step.component, __composition: step })),
    [steps],
  );

  const stepKeyToIndex = useMemo(() => {
    const map = new Map<string, number>();
    stepIds.forEach((ids, index) => ids.forEach(id => map.set(id, index)));
    return map;
  }, [stepIds]);

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
    setAttemptedSubmit(true);
    const invalid = validateAllFields({ stepIndex: currentStepIndex });

    if (invalid.length > 0) {
      revealFirstInvalid(invalid);
      return;
    }

    setAttemptedSubmit(false);

    const { getJumpTarget: jump, isStepVisible: stepVisible } = rulesRef.current;
    const currentIds = stepIds[currentStepIndex];

    if (currentIds?.length) {
      const jumpTarget = jump(currentIds);
      if (jumpTarget) {
        const targetIndex = stepKeyToIndex.get(jumpTarget);
        if (targetIndex !== undefined) {
          stepHistoryRef.current.push(currentStepIndex);
          setCurrentStepIndex(targetIndex);
          return;
        }
      }
    }

    let next = currentStepIndex + 1;
    while (next < lastStepIndex && !stepVisible(stepIds[next] ?? [])) {
      next++;
    }
    stepHistoryRef.current.push(currentStepIndex);
    setCurrentStepIndex(Math.min(lastStepIndex, next));
  }, [
    currentStepIndex,
    lastStepIndex,
    stepIds,
    stepKeyToIndex,
    setAttemptedSubmit,
    validateAllFields,
    revealFirstInvalid,
  ]);

  const prevStep = useCallback(() => {
    setAttemptedSubmit(false);

    const prev = stepHistoryRef.current.pop();
    setCurrentStepIndex(prev ?? 0);
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
      const formData = dropShadowedBlanks(new FormData(formRef.current!));

      if (submitHandler) {
        await submitHandler(formData, { action: action ?? '' });
      } else {
        const response = await fetch(action ?? '', {
          method: 'POST',
          body: formData,
        });

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
      stepHistoryRef.current = [];
      scrollToElement(scrollToOnSuccess);
    } catch (error) {
      // Only a handler's own error was written for a visitor to read. The
      // built-in POST would offer `Failed to fetch` or a bare status code.
      setStatus('error', submitHandler ? error : undefined);
      scrollToElement(scrollToOnError);
    }
  };

  return (
    <FormStepsContext.Provider value={{ currentStepIndex, nextStep, prevStep }}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onReset={e => {
          e.preventDefault();
          resetFields();
          setAttemptedSubmit(false);
          setCurrentStepIndex(0);
          stepHistoryRef.current = [];
        }}
      >
        {children}
      </form>
    </FormStepsContext.Provider>
  );
}

export default function FormWrapper(props: FormWrapperProps) {
  return (
    <FormValidationProvider>
      <FormRulesProvider rules={Array.isArray(props.rules) ? props.rules : undefined}>
        <FormWrapperContent {...props} />
      </FormRulesProvider>
    </FormValidationProvider>
  );
}
