import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
      displayName: 'Article Title',
    },
    description: {
      type: 'string',
      displayName: 'Article Description',
    },
    body: {
      type: 'richText',
      displayName: 'Article Body',
    },
  },
  compositionBehaviors: ['elementEnabled'],
});

type ArticlePageProps = {
  content: ContentProps<typeof ArticleContentType>;
};

function Article({ content }: ArticlePageProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <div>
      <h1 {...pa('title')}>{content.title}</h1>
      <p {...pa('description')}>{content.description}</p>
      <RichText {...pa('body')} content={content.body?.json} />
    </div>
  );
}

export default Article;
