import Preview from '@/components/internal/Preview';
import { GraphClient } from 'optimizely-cms-sdk';
import {
  OptimizelyComponent,
  setPreviewMode,
} from 'optimizely-cms-sdk/dist/render/react';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });

  //   const contentType = await client.fetchContentType(path);
  //   const query = createQuery(contentType);
  const response = await client.fetchPreviewContent(await searchParams);
  setPreviewMode(await searchParams);

  return (
    <>
      <OptimizelyComponent opti={response} />
      <script
        src={`${process.env.OPTIMIZELY_HOST}/util/javascript/communicationinjector.js`}
      ></script>
      <Preview />
    </>
  );
}
