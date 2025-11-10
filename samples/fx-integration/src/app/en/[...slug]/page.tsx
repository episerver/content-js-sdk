import { getVariation } from '@/lib/fx';
import { GraphClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

function returnFirst<T>(content: T[]) {
  if (content.length === 0) {
    notFound();
  }

  return content[0];
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const path = `/en/${slug.join('/')}/`;
  const variation = await getVariation(path);

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });

  if (!variation) {
    console.log('Showing original');

    const content = await client.getContentByPath(path).then(returnFirst);

    return <OptimizelyComponent opti={content} />;
  }

  const content = await client
    .getContentByPath(path, {
      variation: { include: 'SOME', value: [variation] },
    })
    .then((content) => {
      // If no variations are found, try to fetch the original
      if (content.length === 0) {
        console.log('Variation not found. Fetching original');
        return client.getContentByPath(path);
      }

      console.log('Showing variation', variation);
      return content;
    })
    .then(returnFirst);

  return <OptimizelyComponent opti={content} />;
}
