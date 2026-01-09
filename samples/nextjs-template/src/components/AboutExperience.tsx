import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { HeroContentType } from './Hero';
import { BannerContentType } from './Banner';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyExperience,
} from '@optimizely/cms-sdk/react/server';

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
  content: ContentProps<typeof AboutExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function AboutExperience({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main className="about-experience">
      <header className="about-header">
        <h1 {...pa('title')}>{content.title}</h1>
        <p {...pa('subtitle')}>{content.subtitle}</p>
      </header>
      {content.section && (
        <div className="about-section" {...pa('section')}>
          <OptimizelyComponent content={content.section} />
        </div>
      )}
      <OptimizelyExperience
        nodes={content.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
