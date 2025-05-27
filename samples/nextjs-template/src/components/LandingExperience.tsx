import Image from 'next/image';
import { contentType, Infer } from 'optimizely-cms-sdk';
import {
  ComponentContainerProps,
  OptimizelyExperience,
  getPreviewAttrs as pa,
} from 'optimizely-cms-sdk/dist/render/react';
import { HeroContentType } from './Hero';

export const LandingExperienceContentType = contentType({
  key: 'LandingExperience',
  displayName: 'Landing Experience',
  baseType: 'experience',
  properties: {
    hero: {
      type: 'component',
      contentType: HeroContentType,
    },
  },
});

type Props = {
  opti: Infer<typeof LandingExperienceContentType>;
};

function ComponentWrapper({ children }: ComponentContainerProps) {
  return <div>{children}</div>;
}

export default function LandingExperienceComponent({ opti }: Props) {
  return (
    <main>
      {opti.hero && (
        <header className={['uni-hero', opti.hero.theme].join(' ')}>
          <Image src={opti.hero.background.url.default} alt="" fill={true} />
          <div className="heading" {...pa('hero')}>
            <h1 {...pa('hero.heading')}>{opti.hero.heading}</h1>
            <p {...pa('hero.summary')}>{opti.hero.summary}</p>
          </div>
        </header>
      )}

      {opti.composition.nodes.map((node) => (
        <OptimizelyExperience
          node={node}
          key={node.key}
          ComponentWrapper={ComponentWrapper}
        />
      ))}
    </main>
  );
}
