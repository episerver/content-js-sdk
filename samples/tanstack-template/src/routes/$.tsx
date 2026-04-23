import { OptimizelyComponent } from "@optimizely/cms-sdk/react/server";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { renderServerComponent } from "@tanstack/react-start/rsc";
import client from "../graphClient";

async function ServerComponent({ path }: { path: string }) {
  const contentPath = path.endsWith("/") ? path : `${path}/`;
  const content = await client.getContentByPath(contentPath);

  if (!content || content.length === 0) return <h1>Error: page not found</h1>;
  return <OptimizelyComponent content={content[0]} />;
}

const getServerPage = createServerFn().handler(
  async ({ data: { path } }: any) => {
    const Renderable = await renderServerComponent(
      <ServerComponent path={path} />,
    );
    return { Renderable };
  },
);

export const Route = createFileRoute("/$")({
  loader: async ({ location: { pathname } }) => {
    const { Renderable } = await getServerPage({
      data: { path: pathname },
    } as any);
    return { Renderable };
  },
  component: Page,
});

function Page() {
  const { Renderable } = Route.useLoaderData();
  return <>{Renderable}</>;
}
