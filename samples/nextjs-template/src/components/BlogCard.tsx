import { contentType, Infer } from '@episerver/cms-sdk';

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
  return (
    <article className="blog-card">
      <h2>{opti.title}</h2>
      <p className="subtitle">{opti.subtitle}</p>
      <div className="blog-meta">
        <span className="author">{opti.author}</span>
        <span className="date">
          {opti.date ? new Date(opti.date).toLocaleDateString() : 'N/A'}
        </span>
      </div>
    </article>
  );
}
