import { contentType, Infer } from '@episerver/cms-sdk';
import { HeroContentType } from './Hero';
import { BannerContentType } from './Banner';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyExperience,
} from '@episerver/cms-sdk/react/server';

export const AboutExperienceContentType = contentType({
  key: 'AboutExperience',
  displayName: 'About Experience',
  baseType: '_experience',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
    },
    subtitle: {
      type: 'string',
      displayName: 'Subtitle',
    },
    section: {
      type: 'content',
      restrictedTypes: [HeroContentType, BannerContentType],
    },
  },
});

type Props = {
  opti: Infer<typeof AboutExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function AboutExperience({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);
  return (
    <main className="about-experience">
      <header className="about-header">
        <h1 {...pa('title')}>{opti.title}</h1>
        <p {...pa('subtitle')}>{opti.title}</p>
      </header>
      {opti.section && (
        <div className="about-section" {...pa('section')}>
          <OptimizelyComponent opti={opti.section} />
        </div>
      )}
      <OptimizelyExperience
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
