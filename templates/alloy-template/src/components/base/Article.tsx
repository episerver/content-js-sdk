import { contentType, Infer } from '@optimizely/cms-sdk';
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
  opti: Infer<typeof ArticleContentType>;
};

function Article({ opti }: ArticlePageProps) {
  const { pa } = getPreviewUtils(opti);
  return (
    <div>
      <h1 {...pa('title')}>{opti.title}</h1>
      <p {...pa('description')}>{opti.description}</p>
      <div>
        <RichText {...pa('body')} content={opti.body?.json} />
      </div>
    </div>
  );
}

export default Article;
