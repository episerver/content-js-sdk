import { navigate } from 'astro:transitions/client';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import PreviewLoader from './PreviewLoader';

export default function PreviewListener() {
  return (
    // `navigate` resolves once the new page is swapped in, so the loader stays up until then
    <PreviewComponent onNavigate={(url) => navigate(url, { history: 'replace' })}>
      <PreviewLoader />
    </PreviewComponent>
  );
}
