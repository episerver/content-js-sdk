import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { BlogCardContentType } from './BlogCard';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyExperience,
} from '@optimizely/cms-sdk/react/server';

export const BlogExperienceContentType = contentType({
  key: 'BlogExperience',
  displayName: 'Blog Experience',
  baseType: '_experience',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
    },
    subtitle: {
      type: 'string',
      displayName: 'Subtitle',
    },
    articles: {
      type: 'array',
      displayName: 'Articles',
      items: {
        type: 'content',
        allowedTypes: [BlogCardContentType],
      },
    },
  },
});

type Props = {
  content: ContentProps<typeof BlogExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function BlogExperience({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main className="blog-experience">
      <header className="blog-header">
        <h1 {...pa('title')}>{content.title}</h1>
        <p {...pa('subtitle')}>{content.subtitle}</p>
      </header>
      <section className="blog-articles" {...pa('articles')}>
        {content?.articles?.map((article, index) => (
          <OptimizelyComponent key={index} content={article} />
        ))}
      </section>
      <OptimizelyExperience
        nodes={content.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
