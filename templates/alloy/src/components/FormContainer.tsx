import { OptiFormsContainerContentType } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';
import FormTitle from './FormTitle';
import FormDescription from './FormDescription';
import FormWrapper from './FormWrapper';
import { FormStatusProvider } from './FormStatusProvider';
import FormAlerts from './FormAlerts';
import GridRow from './GridRow';
import GridColumn from './GridColumn';

type FormContainerProps = {
  content: OptiFormsContainerContentType;
};

export default function FormContainer({ content }: FormContainerProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <FormStatusProvider>
      <div id='form-alert' className='max-w-7xl py-6 sm:py-8 md:py-10 lg:py-12'>
        <div className='space-y-6 sm:space-y-8'>
          <FormTitle title={content.Title ?? null} previewAttributes={pa} />
          <FormDescription
            description={content.Description ?? null}
            previewAttributes={pa}
          />
          <FormAlerts
            submitConfirmationMessage={content.SubmitConfirmationMessage ?? null}
          />

          <FormWrapper action={content.SubmitUrl?.default ?? ''}>
            <OptimizelyGridSection
              nodes={content.nodes ?? []}
              row={GridRow}
              column={GridColumn}
            />
          </FormWrapper>
        </div>
      </div>
    </FormStatusProvider>
  );
}
