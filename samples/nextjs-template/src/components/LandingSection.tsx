import { contentType, displayTemplate, Infer } from '@episerver/cms-sdk';
import { SmallFeatureGridContentType } from './SmallFeatureGrid';
import { VideoFeatureContentType } from './VideoFeature';
import {
  getPreviewUtils,
  OptimizelyComponent,
} from '@episerver/cms-sdk/dist/render/react';

export const LandingSectionContentType = contentType({
  key: 'LandingSection',
  baseType: 'component',
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

export const DisplayTemplate = displayTemplate({
  key: 'LandingSectionDisplayTemplate',
  isDefault: true,
  displayName: 'LandingSectionDisplayTemplate',
  baseType: 'component',
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
  opti: Infer<typeof LandingSectionContentType>;
};

export default function LandingSection({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);
  return (
    <section>
      <header>
        <h2 {...pa('heading')}>{opti.heading}</h2>
        <p {...pa('subtitle')}>{opti.subtitle}</p>
      </header>
      {(opti.sections ?? []).map((section, i) => (
        <OptimizelyComponent opti={section} key={i} />
      ))}
    </section>
  );
}
