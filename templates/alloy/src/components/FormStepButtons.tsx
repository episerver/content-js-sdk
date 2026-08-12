'use client';

import { useFormStep } from '@optimizely/cms-sdk/forms/react';

type FormStepButtonsProps = {
  children: React.ReactNode;
};

export default function FormStepButtons({ children }: FormStepButtonsProps) {
  const { currentStepIndex, prevStep } = useFormStep();

  return (
    <div className='flex justify-between items-center gap-4'>
      {currentStepIndex > 0 && (
        <button
          type='button'
          onClick={prevStep}
          className='px-6 py-3 rounded-lg font-medium text-slate-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300'
        >
          Previous
        </button>
      )}
      <div className='flex-1' />
      <div>{children}</div>
    </div>
  );
}
