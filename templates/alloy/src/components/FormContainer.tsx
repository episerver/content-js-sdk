import { OptiFormsContainerContentType } from '@optimizely/cms-sdk';
import {
  getContext,
  getPreviewUtils,
  OptimizelyGridSection,
} from '@optimizely/cms-sdk/react/server';
import FormTitle from './FormTitle';
import FormDescription from './FormDescription';
import FormSuccessAlert from './FormSuccessAlert';
import FormErrorAlert from './FormErrorAlert';
import GridRow from './GridRow';
import GridColumn from './GridColumn';

type FormContainerProps = {
  content: OptiFormsContainerContentType;
};

export default function FormContainer({ content }: FormContainerProps) {
  const { pa } = getPreviewUtils(content);
  const formState = (getContext() as any).formState;

  return (
    <div className='max-w-7xl py-6 sm:py-8 md:py-10 lg:py-12'>
      <div className='space-y-6 sm:space-y-8'>
        <FormTitle title={content.Title ?? null} previewAttributes={pa} />
        <FormDescription
          description={content.Description ?? null}
          previewAttributes={pa}
        />
        <FormSuccessAlert
          show={formState === 'success'}
          message={content.SubmitConfirmationMessage ?? null}
        />
        <FormErrorAlert show={formState === 'fail'} />

        <form method='POST' action={content.SubmitUrl?.default ?? ''}>
          <OptimizelyGridSection
            nodes={content.nodes ?? []}
            row={GridRow}
            column={GridColumn}
          />
        </form>
      </div>
    </div>
  );
}

