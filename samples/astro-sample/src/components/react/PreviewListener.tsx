import { refreshInPlace } from '@optimizely/cms-sdk/core';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import PreviewLoader from './PreviewLoader';

export default function PreviewListener() {
  return (
    <PreviewComponent onNavigate={refreshInPlace()}>
      <PreviewLoader />
    </PreviewComponent>
  );
}
