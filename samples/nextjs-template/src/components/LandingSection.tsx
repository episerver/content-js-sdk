import {
  contentType,
  displayTemplate,
  ContentProps,
} from '@optimizely/cms-sdk';
import { SmallFeatureGridContentType } from './SmallFeatureGrid';
import { VideoFeatureContentType } from './VideoFeature';
import {
  getPreviewUtils,
  OptimizelyComponent,
} from '@optimizely/cms-sdk/react/server';

export const LandingSectionContentType = contentType({
  key: 'LandingSection',
  baseType: '_component',
  displayName: 'Landing Section',
  properties: {
    heading: {
      type: 'string',
    },
    subtitle: {
      type: 'string',
    },
    sections: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [SmallFeatureGridContentType, VideoFeatureContentType],
      },
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

export const LandingSectionDisplayTemplate = displayTemplate({
  key: 'LandingSectionDisplayTemplate',
  isDefault: true,
  displayName: 'LandingSectionDisplayTemplate',
  baseType: '_component',
  settings: {
    background: {
      editor: 'select',
      displayName: 'Background',
      sortOrder: 0,
      choices: {
        red: {
          displayName: 'Red',
          sortOrder: 0,
        },
        blue: {
          displayName: 'Blue',
          sortOrder: 1,
        },
      },
    },
  },
});

type Props = {
  content: ContentProps<typeof LandingSectionContentType>;
};

export default function LandingSection({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <section>
      <header className="landing-header">
        <h2 {...pa('heading')}>{content.heading}</h2>
        <p {...pa('subtitle')}>{content.subtitle}</p>
      </header>
      <div {...pa('sections')}>
        {(content.sections ?? []).map((section, i) => (
          <OptimizelyComponent content={section} key={i} />
        ))}
      </div>
    </section>
  );
}
