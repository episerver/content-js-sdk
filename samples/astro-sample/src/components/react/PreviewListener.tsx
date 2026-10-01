import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import PreviewLoader from './PreviewLoader';

export default function PreviewListener() {
  return (
    <PreviewComponent onNavigate={(url: string) => window.location.replace(url)}>
      <PreviewLoader />
    </PreviewComponent>
  );
}
