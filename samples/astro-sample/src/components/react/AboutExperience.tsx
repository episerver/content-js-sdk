import type { ContentProps } from '@optimizely/cms-sdk';
import {
  type ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyComposition,
} from '@optimizely/cms-sdk/react/server';
import { AboutExperienceContentType } from '@/lib/contentTypes';

type Props = {
  content: ContentProps<typeof AboutExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function AboutExperience({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main className='about-experience'>
      <header className='about-header'>
        <h1 {...pa('title')}>{content.title}</h1>
        <p {...pa('subtitle')}>{content.subtitle}</p>
      </header>
      {content.section && (
        <div className='about-section' {...pa('section')}>
          <OptimizelyComponent content={content.section} />
        </div>
      )}
      <OptimizelyComposition nodes={content.composition.nodes ?? []} ComponentWrapper={ComponentWrapper} />
    </main>
  );
}
