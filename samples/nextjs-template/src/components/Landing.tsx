import { contentType, Infer } from '@episerver/cms-sdk';
import {
  getPreviewUtils,
  OptimizelyComponent,
} from '@episerver/cms-sdk/react/server';
import { LandingSectionContentType } from './LandingSection';
import { HeroContentType } from './Hero';
import Image from 'next/image';

export const ContentType = contentType({
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
  opti: Infer<typeof ContentType>;
};

export default function LandingComponent({ opti }: Props) {
  const { pa, src } = getPreviewUtils(opti);
  return (
    <main>
      {opti.hero && (
        <header className={['uni-hero', opti.hero.theme].join(' ')}>
          {opti.hero.background && (
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
      {opti.sections?.map((section, i) => (
        <OptimizelyComponent key={i} opti={section} />
      ))}
    </main>
  );
}
