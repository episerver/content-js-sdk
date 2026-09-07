import { type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { LandingPageContentType } from '@/lib/contentTypes';

type Props = {
  content: ContentProps<typeof LandingPageContentType>;
};

export default function LandingComponent({ content }: Props) {
  const { pa, src } = getPreviewUtils(content);
  const heroBackgroundUrl = src(content.hero?.background);
  return (
    <main>
      {content.hero && (
        <header className={['uni-hero', content.hero.theme].join(' ')}>
          {heroBackgroundUrl && <img src={heroBackgroundUrl} alt='' className='hero-background' />}
          <div className='heading' {...pa('hero')}>
            <h1 {...pa('hero.heading')}>{content.hero.heading}</h1>
            <p {...pa('hero.summary')}>{content.hero.summary}</p>
          </div>
        </header>
      )}
      <div {...pa('sections')}>
        {content.sections?.map((section, i) => (
          <OptimizelyComponent key={i} content={section} />
        ))}
      </div>
    </main>
  );
}
