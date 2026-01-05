import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BlogCardContentType = contentType({
  key: 'BlogCard',
  displayName: 'Blog Card',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
    },
    subtitle: {
      type: 'string',
      displayName: 'Subtitle',
    },
    author: {
      type: 'string',
      displayName: 'Author',
    },
    date: {
      type: 'dateTime',
      displayName: 'Date',
    },
  },
});

type Props = {
  content: ContentProps<typeof BlogCardContentType>;
};

export default function BlogCard({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <article className="blog-card">
      <h2 {...pa('title')}>{content.title}</h2>
      <p className="subtitle" {...pa('subtitle')}>
        {content.subtitle}
      </p>
      <div className="blog-meta">
        <span className="author" {...pa('author')}>
          {content.author}
        </span>
        <span className="date" {...pa('date')}>
          {content.date ? new Date(content.date).toLocaleDateString() : 'N/A'}
        </span>
      </div>
    </article>
  );
}
