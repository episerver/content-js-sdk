import { contentType, Infer } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article page',
  baseType: '_page',
  properties: {
    heading: {
      displayName: 'The Headline 😊',
      type: 'string',
    },
    subtitle: {
      type: 'string',
      displayName: 'SUBTITLE!!!!!!',
    },
    body: {
      displayName: 'body 🐈',
      type: 'richText',
    },
  },
});

type Props = {
  opti: Infer<typeof ArticleContentType>;
};

export default function Article({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);

  return (
    <main>
      <h1 {...pa('heading')}>{opti.heading}</h1>
      <p {...pa('subtitle')}>{opti.subtitle}</p>
      <div
        {...pa('body')}
        dangerouslySetInnerHTML={{ __html: opti.body?.html ?? '' }}
      />
    </main>
  );
}

