import Image from 'next/image';
import { contentType, Infer } from '@optimizely/cms-sdk';
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
  opti: Infer<typeof LandingExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function LandingExperienceComponent({ opti }: Props) {
  const { pa, src } = getPreviewUtils(opti);
  const bg = src(opti.hero?.background);
  return (
    <main>
      {opti.hero && (
        <header className={['uni-hero', opti.hero.theme].join(' ')}>
          {bg ? (
            <Image
              src={bg}
              alt=""
              fill={true}
              {...pa('hero.background')}
            />
          ) : null}
          <div className="heading" {...pa('hero')}>
            <h1 {...pa('hero.heading')}>{opti.hero.heading}</h1>
            <p {...pa('hero.summary')}>{opti.hero.summary}</p>
          </div>
        </header>
      )}
      <OptimizelyExperience
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
