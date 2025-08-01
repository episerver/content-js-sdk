import { contentType, Infer } from '@episerver/cms-sdk';
import { getPreviewUtils } from '@episerver/cms-sdk/react/server';
import { ArticleContentType } from './Article';

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
  opti: Infer<typeof FAQContentType>;
};

export default function FAQ({ opti }: FAQProps) {
  const { pa } = getPreviewUtils(opti);
  return (
    <section className="about-us">
      <h2>{opti.heading}</h2>
      <div className="about-us-content">
        <div className="about-us-text">
          <div
            {...pa('body')}
            dangerouslySetInnerHTML={{ __html: opti.body?.html ?? '' }}
          />
        </div>
      </div>
    </section>
  );
}
