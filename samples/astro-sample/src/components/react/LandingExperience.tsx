import type { ContentProps } from '@optimizely/cms-sdk';
import { type ComponentContainerProps, OptimizelyComposition, getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { LandingExperienceContentType } from '@/lib/contentTypes';

type Props = {
  content: ContentProps<typeof LandingExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function LandingExperienceComponent({ content }: Props) {
  const { pa, src } = getPreviewUtils(content);
  const heroBackgroundUrl = src(content.hero?.background);
  return (
    <main>
      {content.hero && (
        <header className={['uni-hero', content.hero.theme].join(' ')}>
          {heroBackgroundUrl && <img src={heroBackgroundUrl} alt='' className='hero-background' {...pa('hero.background')} />}
          <div className='heading' {...pa('hero')}>
            <h1 {...pa('hero.heading')}>{content.hero.heading}</h1>
            <p {...pa('hero.summary')}>{content.hero.summary}</p>
          </div>
        </header>
      )}
      <OptimizelyComposition nodes={content.composition.nodes ?? []} ComponentWrapper={ComponentWrapper} />
    </main>
  );
}
