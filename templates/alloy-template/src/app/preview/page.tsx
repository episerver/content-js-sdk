import { getClient, type PreviewParams } from '@optimizely/cms-sdk';
import { ContentLayout } from '@/components/base/ContentLayout';
import Script from 'next/script';
import Header from '@/components/base/Header';
import Footer from '@/components/base/Footer';
import { withAppContext } from '@optimizely/cms-sdk/react/server';
import { NextPreviewComponent } from '@optimizely/cms-sdk/react/nextjs';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function Page({ searchParams }: Props) {
  const client = getClient();

  const content = await client
    .getPreviewContent(
      // TODO: check types in runtime properly
      (await searchParams) as PreviewParams,
    )
    .catch(err => {
      console.log(err.errors);
      console.log(err.request?.query);
      throw err;
    });

  // Get the path from the response metadata
  const path = content._metadata?.url?.hierarchical || '/';

  return (
    <>
      <Script
        src={
          new URL('/util/javascript/communicationinjector.js', process.env.OPTIMIZELY_CMS_URL).href
        }
      ></Script>
      <NextPreviewComponent />
      <Header currentPath={path} />
      <ContentLayout content={content} currentPath={path} />
      <Footer />
    </>
  );
}

export default withAppContext(Page);
