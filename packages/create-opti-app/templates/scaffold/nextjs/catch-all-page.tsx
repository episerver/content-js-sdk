// @ts-nocheck
import { getClient } from '@optimizely/cms-sdk';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const client = getClient();
  const path = `/${slug.join('/')}/`;
  const content = await client.getContentByPath(path);

  return <pre>{JSON.stringify(content[0], null, 2)}</pre>;
}
