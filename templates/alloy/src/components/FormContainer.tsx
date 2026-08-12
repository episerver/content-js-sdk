import { OptiFormsContainerContentType } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';
import { FormStatusProvider, FormWrapper } from '@optimizely/cms-sdk/forms/react';
import FormTitle from './FormTitle';
import FormDescription from './FormDescription';
import FormAlerts from './FormAlerts';
import FormStepContainer from './FormStepContainer';
import FormStepTracker from './FormStepTracker';
import GridRow from './GridRow';
import GridColumn from './GridColumn';

type FormContainerProps = {
  content: OptiFormsContainerContentType;
};

export default function FormContainer({ content }: FormContainerProps) {
  const { pa } = getPreviewUtils(content);
  const nodes = content.nodes ?? [];
  const buttonNodes = nodes.filter(node => node.__typename === 'OptiFormsSubmitElementContentType');
  const stepNodes = nodes.filter(node => node.__typename !== 'OptiFormsSubmitElementContentType');

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

          <FormWrapper
            scrollToOnSuccess='form-alert'
            scrollToOnError={false}
            action={content.SubmitUrl?.default ?? ''}
            steps={stepNodes}
          >
            <FormStepTracker steps={stepNodes.length} />
            {stepNodes.map((node, index) => (
              <FormStepContainer key={index} index={index}>
                <OptimizelyGridSection nodes={[node]} row={GridRow} column={GridColumn} />
              </FormStepContainer>
            ))}
            <div className='mt-8 flex items-center gap-4'>
              <OptimizelyGridSection nodes={buttonNodes} row={GridRow} column={GridColumn} />
            </div>
          </FormWrapper>
        </div>
      </div>
    </FormStatusProvider>
  );
}
