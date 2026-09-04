import { OptimizelyComponent, withAppContext } from '@optimizely/cms-sdk/react/server';
import { PreviewComponent as OptiPreviewComponent } from '@optimizely/cms-sdk/react/client';
import PreviewLoader from './PreviewLoader';

interface PreviewPageProps {
  content: any;
}

function PreviewPageComponent({ content }: PreviewPageProps) {
  return (
    <>
      <OptiPreviewComponent
        onNavigate={(url: string) => {
          window.location.replace(url);
        }}
      >
        <PreviewLoader />
      </OptiPreviewComponent>
      <OptimizelyComponent content={content} />
    </>
  );
}

export default withAppContext(PreviewPageComponent);

