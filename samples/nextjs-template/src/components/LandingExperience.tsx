import Image from 'next/image';
import { contentType, Infer } from 'optimizely-cms-sdk';
import {
  ComponentWrapperProps,
  StructureWrapperProps,
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

function Row({ children }: StructureWrapperProps) {
  return <div>{children}</div>;
}

function Column({ children }: StructureWrapperProps) {
  return <div>{children}</div>;
}

function Section({ children }: StructureWrapperProps) {
  return <div>{children}</div>;
}

function ComponentWrapper({ children }: ComponentWrapperProps) {
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

      <OptimizelyExperience
        nodes={opti.composition.nodes}
        Component={ComponentWrapper}
        Row={Row}
        Column={Column}
        Section={Section}
      />
    </main>
  );
}
