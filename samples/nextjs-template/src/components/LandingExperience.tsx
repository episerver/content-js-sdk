import Image from 'next/image';
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import {
  ComponentContainerProps,
  OptimizelyExperience,
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
  return (
    <main>
      {content.hero && (
        <header className={['uni-hero', content.hero.theme].join(' ')}>
          {(content.hero.background?.item?.Url ??
            content.hero.background?.url.default) && (
            <Image
              src={src(content.hero.background)}
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
      <OptimizelyExperience
        nodes={content.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
