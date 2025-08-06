import { GraphClient, type PreviewParams } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';
import { PreviewComponent } from '@episerver/cms-sdk/react/client';
import Script from 'next/script';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
  const previewParams = (await searchParams) as PreviewParams;
  const client = new GraphClient(previewParams, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });

  const response = await client.fetchPreviewContent(previewParams);

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
