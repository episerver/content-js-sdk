import Image from 'next/image';
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import {
  ComponentContainerProps,
  OptimizelyComposition,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';
import { HeroContentType } from './Hero';

export const LandingExperienceContentType = contentType({
  key: 'LandingExperience',
  displayName: 'Landing Experience',
  baseType: '_experience',
  properties: {
    hero: {
      type: 'component',
      contentType: HeroContentType,
    },
  },
});

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
          {heroBackgroundUrl && (
            <Image
              src={heroBackgroundUrl}
              alt=""
              fill={true}
              {...pa('hero.background')}
            />
          )}
          <div className="heading" {...pa('hero')}>
            <h1 {...pa('hero.heading')}>{content.hero.heading}</h1>
            <p {...pa('hero.summary')}>{content.hero.summary}</p>
          </div>
        </header>
      )}
      <OptimizelyComposition
        nodes={content.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
