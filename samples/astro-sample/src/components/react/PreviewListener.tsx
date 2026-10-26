import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import { patchChildren } from '@/lib/patchChildren';
import PreviewLoader from './PreviewLoader';

let inFlight: AbortController | undefined;

const fetchPartial = async (search: string, signal: AbortSignal) => {
  const response = await fetch(`/preview/partial${search}`, { signal });
  if (!response.ok) throw new Error(`Preview partial failed with ${response.status}`);
  return response.text();
};

const withoutToken = (url: string) => {
  const parsed = new URL(url, location.href);
  parsed.searchParams.delete('preview_token');
  return parsed.href;
};

// `src()` appends the preview token, which changes on every save; reusing the live URL keeps the image loaded.
const reuseImageUrls = (root: Element, fragment: DocumentFragment) => {
  const liveUrls = new Map(
    [...root.querySelectorAll('img[src]')].map(it => [
      withoutToken(it.getAttribute('src')!),
      it.getAttribute('src')!,
    ]),
  );

  fragment.querySelectorAll('img[src]').forEach(it => {
    const liveUrl = liveUrls.get(withoutToken(it.getAttribute('src')!));
    if (liveUrl) it.setAttribute('src', liveUrl);
  });
};

// Swaps only the rendered content, so a save never navigates the preview.
const refreshContent = async (url: string) => {
  const target = new URL(url);
  const root = document.getElementById('preview-root');
  if (!root || target.pathname !== location.pathname) return window.location.replace(url);

  // A slow response for an earlier save must not overwrite a newer one
  inFlight?.abort();
  const controller = new AbortController();
  inFlight = controller;

  try {
    const fragment = document
      .createRange()
      .createContextualFragment(await fetchPartial(target.search, controller.signal));

    reuseImageUrls(root, fragment);
    patchChildren(root, fragment);
    // A manual reload then uses the latest preview token
    history.replaceState(history.state, '', target.pathname + target.search);
  } catch {
    if (!controller.signal.aborted) window.location.replace(url);
  }
};

export default function PreviewListener() {
  return (
    <PreviewComponent onNavigate={refreshContent}>
      <PreviewLoader />
    </PreviewComponent>
  );
}
