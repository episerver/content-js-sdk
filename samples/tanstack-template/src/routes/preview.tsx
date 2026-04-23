import { createFileRoute } from "@tanstack/react-router";
import { type PreviewParams } from "@optimizely/cms-sdk";
import { OptimizelyComponent } from "@optimizely/cms-sdk/react/server";
import { PreviewComponent } from "@optimizely/cms-sdk/react/client";
import { withAppContext } from "@optimizely/cms-sdk/react/server";
import { createServerFn } from "@tanstack/react-start";
import { renderServerComponent } from "@tanstack/react-start/rsc";
import client from "../graphClient";

type Props = {
  search: PreviewParams & {
    ver: number;
  };
};

const convertToStrings = (it: PreviewParams & {
    ver: number;
  }): PreviewParams => ({
    ...it,
    ver: String(it.ver)
  })

async function Page({ search }: Props) {
  const stringOnlySearch = convertToStrings(search)
  const content = await client.getPreviewContent(stringOnlySearch);

  return (
    <>
      <script
        src={`${process.env.OPTIMIZELY_CMS_URL}/util/javascript/communicationinjector.js`}
      />
      <PreviewComponent />
      <OptimizelyComponent content={content} />
    </>
  );
}

const PageWithContext = withAppContext(Page);

const getPreviewPage = createServerFn().handler(
  async ({ data: { search } }: any) => {
    const Renderable = await renderServerComponent(
      <PageWithContext search={search} />,
    );
    return { Renderable };
  },
);

export const Route = createFileRoute("/preview")({
  loader: async ({ location: { search } }) => {
    const { Renderable } = await getPreviewPage({
      data: { search },
    } as any);
    return { Renderable };
  },
  component: Preview,
});

function Preview() {
  const { Renderable } = Route.useLoaderData();
  return <>{Renderable}</>;
}
