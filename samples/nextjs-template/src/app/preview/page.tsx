import { GraphClient } from 'optimizely-cms-sdk';
import { PreviewParams } from 'optimizely-cms-sdk/dist/graph';
import { OptimizelyComponent } from 'optimizely-cms-sdk/dist/render/react';
import { PreviewComponent } from 'optimizely-cms-sdk/dist/preview/react';
import Script from 'next/script';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });

  const response = await client.fetchPreviewContent(
    // TODO: check types in runtime properly
    (await searchParams) as PreviewParams
  );

  return (
    <>
      <Script
        src={`${process.env.OPTIMIZELY_CMS_HOST}/util/javascript/communicationinjector.js`}
      ></Script>
      <PreviewComponent />
      <OptimizelyComponent opti={response} />
    </>
  );
}
