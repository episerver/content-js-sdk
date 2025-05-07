import Image from 'next/image';
import { contentType, Infer } from 'optimizely-cms-sdk';
import { OptimizelyComponent } from 'optimizely-cms-sdk/dist/render/react';
import { LandingSectionContentType } from './LandingSection';
import { ContentType as CustomImage } from './CustomImage';
import { ArticleContentType } from './Article';
import { HeroContentType } from './Hero';

export const ContentType = contentType({
  key: 'Landing',
  displayName: 'Landing page',
  baseType: 'page',
  properties: {
    hero: {
      type: 'component',
      contentType: HeroContentType,
    },

    // firstSection: {
    //   type: 'content',
    //   allowedTypes: [LandingSectionContentType],
    // },
    sections: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [LandingSectionContentType],
        restrictedTypes: [ArticleContentType],
      },
    },
  },
  component: LandingComponent,
});

type Props = {
  opti: Infer<typeof ContentType>;
};

export default function LandingComponent({ opti }: Props) {
  return (
    <main>
      <header className={['uni-hero', opti.hero.theme].join(' ')}>
        <Image src={opti.hero.background.url.default} alt="" fill={true} />
        <div className="heading">
          <h1>{opti.hero.heading}</h1>
          <p>{opti.hero.summary}</p>
        </div>
      </header>
      {opti.sections.map((section, i) => (
        <OptimizelyComponent key={i} opti={section} />
      ))}
    </main>
  );
}
