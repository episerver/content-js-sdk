import { ContentLayout } from '@/components/base/ContentLayout';
import Footer from '@/components/base/Footer';
import Header from '@/components/base/Header';
import { getClient } from '@optimizely/cms-sdk';
import { setContext, withAppContext } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export async function Page({ params }: Props) {
  const { slug } = await params;

  const client = getClient();
  const path = `/${slug.join('/')}/`;

  const content = await client.getContentByPath(path);

  if (content.length === 0) {
    notFound();
  }

  // Set initial context for this request (will be used in components or other server functions)
  setContext({
    currentContent: content[0],
    locale: content[0]?._metadata?.locale,
    type: content[0]?.__typename,
    key: content[0]?._metadata?.key,
  });

  return (
    <>
      <Header currentPath={path} />
      <ContentLayout content={content[0]} currentPath={path} />
      <Footer />
    </>
  );
}

export default withAppContext(Page);
