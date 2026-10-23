import { navigate } from 'astro:transitions/client';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import PreviewLoader from './PreviewLoader';

export default function PreviewListener() {
  return (
    // `navigate` resolves once the new page is swapped in, so the loader stays up until then.
    // A save emits a second event ~350ms later once Graph has indexed it; 500ms merges both.
    <PreviewComponent
      refreshTimeout={500}
      onNavigate={(url) => navigate(url, { history: 'replace' })}
    >
      <PreviewLoader />
    </PreviewComponent>
  );
}
