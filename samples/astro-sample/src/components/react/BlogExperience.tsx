import type { ContentProps } from '@optimizely/cms-sdk';
import {
  type ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyComposition,
} from '@optimizely/cms-sdk/react/server';
import { BlogExperienceContentType } from '@/lib/contentTypes';

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
    <main className='blog-experience'>
      <header className='blog-header'>
        <h1 {...pa('title')}>{content.title}</h1>
        <p {...pa('subtitle')}>{content.subtitle}</p>
      </header>
      <section className='blog-articles' {...pa('articles')}>
        {content?.articles?.map((article, index) => (
          <OptimizelyComponent key={index} content={article} />
        ))}
      </section>
      <OptimizelyComposition nodes={content.composition.nodes ?? []} ComponentWrapper={ComponentWrapper} />
    </main>
  );
}
