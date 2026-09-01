'use client';

import { useFormSubmission } from '@optimizely/cms-sdk/forms/react';
import { cn } from '../../lib/utils';

type FormAlertsProps = {
  submitConfirmationMessage: string | null;
};

function Alert({ tone, children }: { tone: 'success' | 'error'; children: string }) {
  return (
    <div
      role='alert'
      className={cn(
        'rounded-2xl border p-4 text-sm font-medium',
        tone === 'success' ?
          'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-red-200 bg-red-50 text-red-800',
      )}
    >
      {children}
    </div>
  );
}

export default function FormAlerts({ submitConfirmationMessage }: FormAlertsProps) {
  const { formSuccess, formError, errorMessage } = useFormSubmission();

  return (
    <>
      {/* A confirmation message is optional in the CMS. Without a fallback, a
          successful submit renders nothing and looks like it did not work. */}
      {formSuccess && (
        <Alert tone='success'>
          {submitConfirmationMessage || 'Thank you. Your form has been submitted.'}
        </Alert>
      )}
      {/* A `submitHandler` can explain the failure; the built-in POST cannot. */}
      {formError && (
        <Alert tone='error'>
          {errorMessage || 'Failed to submit form. Please try again.'}
        </Alert>
      )}
    </>
  );
}
