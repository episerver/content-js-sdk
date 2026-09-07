import type { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { FAQContentType } from '@/lib/contentTypes';

export type FAQProps = {
  content: ContentProps<typeof FAQContentType>;
};

export default function FAQ({ content }: FAQProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <section className='about-us'>
      <h2>{content.heading}</h2>
      <div className='about-us-content'>
        <div className='about-us-text'>
          <div {...pa('body')} dangerouslySetInnerHTML={{ __html: content.body?.html ?? '' }} />
        </div>
      </div>
    </section>
  );
}
