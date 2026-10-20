'use client';

import {
  ReactNode,
  useRef,
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { FormControllerProvider } from './FormValidationContext.js';
import { useFormSubmissionStore } from './FormSubmissionProvider.js';
import { FormRulesProvider, useFormRules } from './FormRulesContext.js';
import { getElementIds } from '../../core/forms/elementId.js';
import { createFormController } from '../../core/forms/controller.js';
import type { FormSubmitHandler } from '../../core/forms/controller.js';
import { ExperienceNode } from '../../infer.js';

export type { FormSubmitHandler };

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

function FormWrapperContent({
  action,
  submitHandler,
  children,
  scrollToOnSuccess = 'form-alert',
  scrollToOnError,
  steps = [],
}: Omit<FormWrapperProps, 'rules'>) {
  const submission = useFormSubmissionStore();
  const { getJumpTarget, isStepVisible } = useFormRules();
  const formRef = useRef<HTMLFormElement>(null);

  const stepIds = useMemo(
    () => steps.map(step => getElementIds({ ...step.component, __composition: step })),
    [steps],
  );

  // An empty action POSTs to the page itself, which answers 405 and surfaces as
  // a generic failure. Usually means the container's Submit URL was left unset.
  if (process.env.NODE_ENV !== 'production' && !action && !submitHandler) {
    console.warn(
      'FormWrapper has no `action` and no `submitHandler`, so the form will post ' +
        "to the current page. Set the form container's Submit URL in the CMS, or " +
        'pass a `submitHandler`.',
    );
  }

  const [controller] = useState(() => createFormController({ submission }));

  // Applied during render rather than in an effect: `submit` can fire before the
  // first effect flushes, and an inline `submitHandler` is new on every render.
  controller.update({
    action,
    submitHandler,
    stepIds,
    stepRules: { getJumpTarget, isStepVisible },
    scrollToOnSuccess,
    scrollToOnError,
  });

  const { currentStepIndex } = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  // Deferred to an effect so the step holding the field has been shown before we
  // scroll to it. No-ops unless a submit left one pending.
  useEffect(() => {
    controller.revealPendingField();
  });

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void controller.submit(new FormData(formRef.current!), formRef.current ?? undefined);
  };

  const handleReset = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    controller.reset();
  };

  return (
    <FormControllerProvider value={controller}>
      <FormStepsContext.Provider
        value={{
          currentStepIndex,
          nextStep: controller.nextStep,
          prevStep: controller.prevStep,
        }}
      >
        <form ref={formRef} onSubmit={handleSubmit} onReset={handleReset}>
          {children}
        </form>
      </FormStepsContext.Provider>
    </FormControllerProvider>
  );
}

export default function FormWrapper({ rules, ...props }: FormWrapperProps) {
  // Outside the content so it can read the step rules this provider exposes.
  return (
    <FormRulesProvider rules={Array.isArray(rules) ? rules : undefined}>
      <FormWrapperContent {...props} />
    </FormRulesProvider>
  );
}
