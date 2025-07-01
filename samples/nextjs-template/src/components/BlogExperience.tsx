import { contentType, Infer } from '@episerver/cms-sdk';
import { BlogCardContentType } from './BlogCard';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyExperience,
} from '@episerver/cms-sdk/react/server';

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
  opti: Infer<typeof BlogExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function BlogExperience({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);
  return (
    <main className="blog-experience">
      <header className="blog-header">
        <h1 {...pa('title')}>{opti.title}</h1>
        <p {...pa('subtitle')}>{opti.subtitle}</p>
      </header>
      <section className="blog-articles">
        {opti?.articles?.map((article, index) => (
          <OptimizelyComponent key={index} opti={article} />
        ))}
      </section>
      <OptimizelyExperience
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
