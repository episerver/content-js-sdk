import { contentType, Infer } from '@episerver/cms-sdk';
import { getPreviewUtils } from '@episerver/cms-sdk/react/server';

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
  opti: Infer<typeof BlogCardContentType>;
};

export default function BlogCard({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);
  return (
    <article className="blog-card">
      <h2 {...pa('title')}>{opti.title}</h2>
      <p className="subtitle" {...pa('subtitle')}>
        {opti.subtitle}
      </p>
      <div className="blog-meta">
        <span className="author" {...pa('author')}>
          {opti.author}
        </span>
        <span className="date" {...pa('date')}>
          {opti.date ? new Date(opti.date).toLocaleDateString() : 'N/A'}
        </span>
      </div>
    </article>
  );
}
