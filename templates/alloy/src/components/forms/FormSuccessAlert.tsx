type FormSuccessAlertProps = {
  show: boolean;
  message: string | null;
};

export default function FormSuccessAlert({ show, message }: FormSuccessAlertProps) {
  // A confirmation message is optional in the CMS. Without a fallback, a
  // successful submit renders nothing at all and looks like it did not work.
  if (!show) return null;
  const text = message || 'Thank you. Your form has been submitted.';

  return (
    <div
      className='p-4 rounded-lg bg-emerald-50 border border-emerald-200'
      role='alert'
    >
      <div className='flex items-start'>
        <div className='flex-shrink-0'>
          <svg
            className='h-5 w-5 text-emerald-600'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
        </div>
        <div className='ml-3'>
          <p className='text-sm font-medium text-emerald-800'>{text}</p>
        </div>
      </div>
    </div>
  );
}

