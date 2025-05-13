import { contentType, Infer } from 'optimizely-cms-sdk';
import { getPreviewAttrs as pa } from 'optimizely-cms-sdk/dist/render/react';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article page',
  baseType: 'page',
  properties: {
    heading: {
      type: 'string',
    },
    subtitle: {
      type: 'string',
    },
    body: {
      type: 'richText',
    },
  },
});

type Props = {
  opti: Infer<typeof ArticleContentType>;
};

export default function Article({ opti }: Props) {
  return (
    <main>
      <h1 {...pa('heading')}>{opti.heading}</h1>
      <p {...pa('subtitle')}>{opti.subtitle}</p>
      <div
        {...pa('body')}
        dangerouslySetInnerHTML={{ __html: opti.body.html }}
      />
    </main>
  );
}
