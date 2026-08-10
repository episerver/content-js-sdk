import { createFileRoute, useRouter } from '@tanstack/react-router';
import { type PreviewParams } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import { withAppContext } from '@optimizely/cms-sdk/react/server';
import { createServerFn } from '@tanstack/react-start';
import { renderServerComponent } from '@tanstack/react-start/rsc';
import client from '../graphClient';

type Props = {
  search: PreviewParams & {
    ver: number;
  };
};

const convertToStrings = (
  it: PreviewParams & {
    ver: number;
  },
): PreviewParams => ({
  ...it,
  ver: String(it.ver),
});

async function Page({ search }: Props) {
  const stringOnlySearch = convertToStrings(search);
  const content = await client.getPreviewContent(stringOnlySearch);

  return (
    <>
      <script
        src={
          new URL(
            '/util/javascript/communicationinjector.js',
            process.env.OPTIMIZELY_CMS_URL,
          ).href
        }
      ></script>
      <OptimizelyComponent content={content} />
    </>
  );
}

const PageWithContext = withAppContext(Page);

const getPreviewPage = createServerFn().handler(async ({ data: { search } }: any) => {
  const Renderable = await renderServerComponent(<PageWithContext search={search} />);
  return { Renderable };
});

export const Route = createFileRoute('/preview')({
  // The match id is `routeId + path + hash(loaderDeps)`. Without this the id is the
  // same for every `ver`, so navigating to a new version reuses the existing match
  // and the loader never re-runs.
  loaderDeps: ({ search }) => search,
  loader: async ({ deps: search }) => {
    const { Renderable } = await getPreviewPage({
      data: { search },
    } as any);
    return { Renderable };
  },
  component: Preview,
});

function Preview() {
  const { Renderable } = Route.useLoaderData();
  const router = useRouter();

  return (
    <>
      <PreviewComponent
        onNavigate={(url, isSameUrl) => {
          // `invalidate` re-runs the loader, which re-renders the page on the server.
          // It returns a promise, so the loading indicator tracks the real round-trip.
          if (isSameUrl) return router.invalidate();
          const parsed = new URL(url);
          return router.navigate({ href: parsed.pathname + parsed.search });
        }}
      />
      {Renderable}
    </>
  );
}
