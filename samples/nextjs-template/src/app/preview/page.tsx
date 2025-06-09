import { GraphClient } from 'optimizely-cms-sdk';
import { PreviewParams } from 'optimizely-cms-sdk/dist/graph';
import { OptimizelyComponent } from 'optimizely-cms-sdk/dist/render/react';
import { PreviewComponent } from 'optimizely-cms-sdk/dist/preview/react';
import Script from 'next/script';
import { runWithPreview } from 'optimizely-cms-sdk/dist/render/previewContext';

type Props = {
  searchParams: Promise<PreviewParams>;
};

export default async function Page({ searchParams }: Props) {
  return runWithPreview(await searchParams, async () => {
    const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
    const response = await client.fetchPreviewContent(await searchParams);

    return (
      <>
        <OptimizelyComponent opti={response} />
        <Script
          src={`${process.env.OPTIMIZELY_CMS_HOST}/util/javascript/communicationinjector.js`}
        />
        <PreviewComponent />
      </>
    );
  });
}
