import { GraphClient, type PreviewParams } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';
import { PreviewComponent } from '@episerver/cms-sdk/react/client';
import Script from 'next/script';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
  const client = new GraphClient(
    process.env.NEXT_PUBLIC_OPTIMIZELY_GRAPH_SINGLE_KEY!,
    {
      graphUrl: process.env.NEXT_PUBLIC_OPTIMIZELY_GRAPH_URL,
    }
  );

  const response = await client.fetchPreviewContent(
    // TODO: check types in runtime properly
    (await searchParams) as PreviewParams
  );

  return (
    <>
      <Script
        src={`${process.env.NEXT_PUBLIC_OPTIMIZELY_CMS_HOST}/util/javascript/communicationinjector.js`}
      ></Script>
      <PreviewComponent />
      <OptimizelyComponent opti={response} />
    </>
  );
}
