'use client';

import {
  ReactNode,
  useRef,
  useState,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { FormValidationProvider, useFormValidation } from './FormValidationContext.js';
import { useFormStatus } from './FormStatusProvider.js';
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

type FormWrapperProps = {
  action: string;
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
  children,
  scrollToOnSuccess = 'form-alert',
  scrollToOnError,
  steps = [],
  rules,
}: FormWrapperProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.min(steps.length, prev + 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  const { setAttemptedSubmit, validateAllFields, getFieldRef } = useFormValidation();
  const { setStatus } = useFormStatus();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    setAttemptedSubmit(true);

    const allFieldsValid = validateAllFields();

    if (!allFieldsValid) {
      const firstInvalidField = Array.from(
        formRef.current?.querySelectorAll('[data-field-name]') ?? [],
      ).find(field => {
        const fieldName = field.getAttribute('data-field-name');
        return fieldName && !getFieldRef(fieldName);
      });

      if (firstInvalidField && firstInvalidField instanceof HTMLElement) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = firstInvalidField.querySelector('input, textarea, [role="radio"]');
        if (input instanceof HTMLElement) input.focus();
      }

      scrollToElement(scrollToOnError);
      return;
    }

    setAttemptedSubmit(false);
    setStatus('submitting');

    try {
      const formData = new FormData(formRef.current!);
      const response = await fetch(action, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus('success');
        formRef.current?.reset();
        setAttemptedSubmit(false);
        scrollToElement(scrollToOnSuccess);
      } else {
        setStatus('error');
        scrollToElement(scrollToOnError);
      }
    } catch (error) {
      setStatus('error');
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
