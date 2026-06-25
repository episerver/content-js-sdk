import { getClient, type PreviewParams } from '@optimizely/cms-sdk';
import Script from 'next/script';
import { OptimizelyComponent, withAppContext } from '@optimizely/cms-sdk/react/server';
import { NextPreviewComponent } from '@optimizely/cms-sdk/react/nextjs';
import { Metadata } from 'next';
import { cache } from 'react';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const getPreviewContent = cache(async (params: PreviewParams) => {
  return await getClient()
    .getPreviewContent(params)
    .catch(err => {
      console.log(err.errors);
      console.log(err.request?.query);
      throw err;
    });
});

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = (await searchParams) as PreviewParams;
  const content = await getPreviewContent(params);

  return {
    title: `Previewing — ${content._metadata.displayName}`,
  };
}

async function Page({ searchParams }: Props) {
  const params = (await searchParams) as PreviewParams;
  const content = await getPreviewContent(params);

  return (
    <>
      <Script
        src={
          new URL(
            '/util/javascript/communicationinjector.js',
            process.env.OPTIMIZELY_CMS_URL,
          ).href
        }
      ></Script>
      <NextPreviewComponent />
      <OptimizelyComponent content={content} />
    </>
  );
}

export default withAppContext(Page);
