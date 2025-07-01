import Image from 'next/image';
import { contentType, createDisplayTemplate, Infer } from '@episerver/cms-sdk';
import {
  ComponentContainerProps,
  OptimizelyExperience,
  getPreviewUtils,
} from '@episerver/cms-sdk/react/server';
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

const LandingSectionTemplate = {
  background: { red: '#ff0000', blue: '#0000ff' },
};

export const LandingDisplayTemplate = createDisplayTemplate(
  'LandingSectionDisplayTemplate',
  '_component',
  LandingSectionTemplate
);

// commented out as it is not used in the current implementation and used for comparison
//
// export const DisplayTemplate = displayTemplate({
//   key: 'LandingSectionDisplayTemplate',
//   isDefault: true,
//   displayName: 'LandingSectionDisplayTemplate',
//   baseType: '_component',
//   settings: {
//     background: {
//       editor: 'select',
//       displayName: 'Background',
//       sortOrder: 0,
//       choices: {
//         red: {
//           displayName: 'Red',
//           sortOrder: 0,
//         },
//         blue: {
//           displayName: 'Blue',
//           sortOrder: 1,
//         },
//       },
//     },
//   },
// });

type Props = {
  opti: Infer<typeof LandingExperienceContentType>;
};

function ComponentWrapper({
  children,
  node,
  displaySettings,
}: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);

  return (
    <div {...pa(node)}>
      {children}
      <div style={{ color: displaySettings?.[0] || 'black' }}>TEST!!!</div>
    </div>
  );
}

export default function LandingExperienceComponent({ opti }: Props) {
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
              {...pa('hero.background')}
            />
          )}
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
