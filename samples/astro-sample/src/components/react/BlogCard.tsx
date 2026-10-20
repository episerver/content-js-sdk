import type { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { BlogCardContentType } from '@/lib/contentTypes';

type Props = {
  content: ContentProps<typeof BlogCardContentType>;
};

export default function BlogCard({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <article className='blog-card'>
      <h2 {...pa('title')}>{content.title}</h2>
      <p className='subtitle' {...pa('subtitle')}>
        {content.subtitle}
      </p>
      <div className='blog-meta'>
        <span className='author' {...pa('author')}>
          {content.author}
        </span>
        <span className='date' {...pa('date')}>
          {content.date ? new Date(content.date).toLocaleDateString() : 'N/A'}
        </span>
      </div>
    </article>
  );
}
