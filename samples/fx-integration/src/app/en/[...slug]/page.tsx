import { getVariation } from '@/lib/fx';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const path = `/en/${slug.join('/')}/`;

  const variation = await getVariation(path);

  if (!variation) {
    return <div>show original</div>;
  }

  return <div>show variation {variation}</div>;
}
