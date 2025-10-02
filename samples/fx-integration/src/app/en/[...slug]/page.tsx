import { getVariation } from '@/lib/fx';
import { GraphClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const path = `/en/${slug.join('/')}/`;
  const variation = await getVariation(path);

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });

  if (!variation) {
    console.log('Showing original');

    const content = await client.getContentByPath(path);

    return <OptimizelyComponent opti={content[0]} />;
  }

  const content = await client
    .getContentByPath(path, {
      variation: { include: 'SOME', value: [variation] },
    })
    .catch(
      // If fetching variations result in an error,
      // we try to fetch the original content
      () => client.getContentByPath(path)
    );

  console.log('Showing variation', variation);

  return <OptimizelyComponent opti={content[0]} />;
}
