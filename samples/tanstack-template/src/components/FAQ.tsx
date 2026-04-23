import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { ArticleContentType } from './Article';
import { RichText } from '@optimizely/cms-sdk/react/richText';

export const FAQContentType = contentType({
  key: 'FAQ',
  baseType: '_page',
  displayName: 'FAQ',
  mayContainTypes: [ArticleContentType],
  properties: {
    heading: {
      type: 'string',
    },
    body: {
      type: 'richText',
    },
  },
});

export type FAQProps = {
  content: ContentProps<typeof FAQContentType>;
};

export default function FAQ({ content }: FAQProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <section className="about-us">
      <h2>{content.heading}</h2>
      <div className="about-us-content">
        <div className="about-us-text">
          <RichText {...pa('body')} content={content.body?.json} />
        </div>
      </div>
    </section>
  );
}
