import { contentType, Infer } from '@optimizely/cms-sdk';
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
  opti: Infer<typeof LandingPageContentType>;
};

export default function LandingComponent({ opti }: Props) {
  const { pa, src } = getPreviewUtils(opti);
  return (
    <main>
      {opti.hero && (
        <header className={['uni-hero', opti.hero.theme].join(' ')}>
          {opti.hero.background?.url.default && (
            <Image
              src={src(opti.hero.background.url.default)}
              alt=""
              fill={true}
            />
          )}
          <div className="heading" {...pa('hero')}>
            <h1 {...pa('hero.heading')}>{opti.hero.heading}</h1>
            <p {...pa('hero.summary')}>{opti.hero.summary}</p>
          </div>
        </header>
      )}
      <div {...pa('sections')}>
        {opti.sections?.map((section, i) => (
          <OptimizelyComponent key={i} opti={section} />
        ))}
      </div>
    </main>
  );
}
