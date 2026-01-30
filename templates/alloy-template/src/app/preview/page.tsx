import { GraphClient, type PreviewParams } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import Script from 'next/script';
import Header from '@/components/base/Header';
import Footer from '@/components/base/Footer';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });

  const response = await client
    .getPreviewContent(
      // TODO: check types in runtime properly
      (await searchParams) as PreviewParams,
    )
    .catch((err) => {
      console.log(err.errors);
      console.log(err.request?.query);
      throw err;
    });

  return (
    <>
      <Script
        src={`${process.env.OPTIMIZELY_CMS_URL}/util/javascript/communicationinjector.js`}
      ></Script>
      <PreviewComponent />
      <Header client={client} currentPath={'/'} />
      <div className="container mx-auto p-10">
        <OptimizelyComponent opti={response} />
      </div>
      <Footer client={client} />
    </>
  );
}
