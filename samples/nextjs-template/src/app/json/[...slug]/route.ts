import { GraphClient } from 'optimizely-cms-sdk/dist/graph';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });
  const c = await client.fetchContent(`/${slug.join('/')}/`);

  return Response.json(c);
}
