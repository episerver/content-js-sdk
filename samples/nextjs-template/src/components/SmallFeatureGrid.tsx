import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { SmallFeatureContentType } from './SmallFeature';
import {
  getPreviewUtils,
  OptimizelyComponent,
} from '@optimizely/cms-sdk/react/server';

export const SmallFeatureGridContentType = contentType({
  key: 'SmallFeatureGrid',
  displayName: 'Small feature grid',
  baseType: '_component',
  properties: {
    smallFeatures: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [SmallFeatureContentType],
      },
    },
  },
});

type Props = {
  content: ContentProps<typeof SmallFeatureGridContentType>;
};

export default function SmallFeatureGrid({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <div className="small-feature-grid" {...pa('smallFeatures')}>
      {content.smallFeatures?.map((feature, i) => (
        <OptimizelyComponent content={feature} key={i} />
      ))}
    </div>
  );
}
