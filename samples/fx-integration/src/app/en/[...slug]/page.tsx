import { getVariation } from '@/lib/fx';
import { GraphClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';
import { getGraphConfig } from '@optimizely/cms-sdk/config';

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

  const client = new GraphClient(getGraphConfig().singleKey, {
    graphUrl: getGraphConfig().graphUrl,
  });

  if (!variation) {
    console.log('Showing original');

    const content = await client.getContentByPath(path).then(returnFirst);

    return <OptimizelyComponent content={content} />;
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

  return <OptimizelyComponent content={content} />;
}
