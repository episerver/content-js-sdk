import { fetchContent } from 'optimizely-cms-sdk/dist/graph';

async function myImport(contentType: string) {
  //   if (contentType === 'InFocus') {
  return import('../../components/Landing').then((r) => r.ContentType);
  //   }
}

export default async function Page() {
  const filter = {
    _metadata: {
      url: {
        default: { eq: '/computers/' },
      },
    },
  };
  console.log(process.env.GRAPH_SINGLE_KEY);
  const c = await fetchContent(process.env.GRAPH_SINGLE_KEY!, filter, myImport);

  console.log(c);
  return <div>{JSON.stringify(c)}</div>;
}
