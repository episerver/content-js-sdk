import { navigate } from 'astro:transitions/client';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import PreviewLoader from './PreviewLoader';

// `navigate` always scrolls to the top; `astro:after-swap` fires after that reset.
const navigateKeepingScroll = async (url: string) => {
  const { scrollX, scrollY } = window;
  const restore = () => window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });

  document.addEventListener('astro:after-swap', restore, { once: true });
  await navigate(url, { history: 'replace' }).finally(() =>
    document.removeEventListener('astro:after-swap', restore),
  );
};

export default function PreviewListener() {
  return (
    // `navigate` resolves once the new page is swapped in, so the loader stays up until then
    <PreviewComponent onNavigate={navigateKeepingScroll}>
      <PreviewLoader />
    </PreviewComponent>
  );
}
