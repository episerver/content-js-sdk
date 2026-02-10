import { contentType, ContentProps } from '@optimizely/cms-sdk';
import {
  getPreviewUtils,
  OptimizelyComponent,
} from '@optimizely/cms-sdk/react/server';
import { LandingSectionContentType } from './LandingSection';
import { HeroContentType } from './Hero';
import Image from 'next/image';

export const LandingPageContentType = contentType({
  key: 'Landing',
  displayName: 'Landing page',
  baseType: '_page',
  properties: {
    hero: {
      type: 'component',
      contentType: HeroContentType,
    },

    sections: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [LandingSectionContentType],
      },
    },
  },
});

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
          {heroBackgroundUrl && (
            <Image src={heroBackgroundUrl} alt="" fill={true} />
          )}
          <div className="heading" {...pa('hero')}>
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
