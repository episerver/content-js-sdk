import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article page',
  baseType: '_page',
  properties: {
    heading: {
      displayName: 'The Headline',
      type: 'string',
    },
    subtitle: {
      type: 'string',
      displayName: 'Subtitle',
    },
    body: {
      displayName: 'Body',
      type: 'richText',
    },
  },
});

type Props = {
  content: ContentProps<typeof ArticleContentType>;
};

export default function Article({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <main>
      <h1 {...pa('heading')}>{content.heading}</h1>
      <p {...pa('subtitle')}>{content.subtitle}</p>
      <div
        {...pa('body')}
        dangerouslySetInnerHTML={{ __html: content.body?.html ?? '' }}
      />
    </main>
  );
}
