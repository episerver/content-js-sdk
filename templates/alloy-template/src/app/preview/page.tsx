import { getClient, type PreviewParams } from '@optimizely/cms-sdk';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import { ContentLayout } from '@/components/base/ContentLayout';
import Script from 'next/script';
import Header from '@/components/base/Header';
import Footer from '@/components/base/Footer';
import { withAppContext } from '@optimizely/cms-sdk/react/server';

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
      <Script src={`${process.env.OPTIMIZELY_CMS_URL}/util/javascript/communicationinjector.js`}></Script>
      <PreviewComponent />
      <Header currentPath={path} />
      <ContentLayout content={content} currentPath={path} />
      <Footer />
    </>
  );
}

export default withAppContext(Page);
