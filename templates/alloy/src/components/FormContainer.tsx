import { OptiFormsContainerContentType } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';
import GridRow from './GridRow';
import GridColumn from './GridColumn';

type FormContainerProps = {
  content: OptiFormsContainerContentType;
};

function FormContainer({ content }: FormContainerProps) {
  const { pa } = getPreviewUtils(content);
  console.log(JSON.stringify(content, null, 2))
  return (
    <main className='bg-white'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8 lg:py-12'>
        <div className='space-y-6 sm:space-y-8'>
          {content.Title && (
            <div className='space-y-3 sm:space-y-4'>
              <h1
                {...pa('heading')}
                className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-5xl'
              >
                {content.Title}
              </h1>
            </div>
          )}

          {content.Description && (
            <div className='space-y-3 sm:space-y-4'>
              <p
                {...pa('Description')}
                className='text-base leading-relaxed text-gray-700 sm:text-lg md:text-xl'
              >
                {content.Description}
              </p>
            </div>
          )}

          <OptimizelyGridSection
            nodes={content.nodes ?? []}
            row={GridRow}
            column={GridColumn}
          />
        </div>
      </div>
    </main>
  );
}

export default FormContainer;
