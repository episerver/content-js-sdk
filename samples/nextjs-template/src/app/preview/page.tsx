import { GraphClient, type PreviewParams } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import Script from 'next/script';
import { getGraphConfig, getCmsUrl } from '@optimizely/cms-sdk/config';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
  const client = new GraphClient(getGraphConfig().singleKey, {
    graphUrl: getGraphConfig().graphUrl,
  });

  const content = await client.getPreviewContent(
    // TODO: check types in runtime properly
    (await searchParams) as PreviewParams
  );

  const cmsUrl = getCmsUrl();

  return (
    <>
      {cmsUrl && (
        <Script
          src={`${cmsUrl}/util/javascript/communicationinjector.js`}
        ></Script>
      )}
      <PreviewComponent />
      <OptimizelyComponent content={content} />
    </>
  );
}
