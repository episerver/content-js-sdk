'use client';

import { useFormStatus } from './FormStatusProvider';
import FormSuccessAlert from './FormSuccessAlert';
import FormErrorAlert from './FormErrorAlert';

type FormAlertsProps = {
  submitConfirmationMessage: string | null;
};

export default function FormAlerts({ submitConfirmationMessage }: FormAlertsProps) {
  const { formSuccess, formError } = useFormStatus();

  return (
    <>
      <FormSuccessAlert show={formSuccess} message={submitConfirmationMessage} />
      <FormErrorAlert show={formError} />
    </>
  );
}
