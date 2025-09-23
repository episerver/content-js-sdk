import { contentType, Infer } from '@optimizely/cms-sdk';
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
  opti: Infer<typeof SmallFeatureGridContentType>;
};

export default function SmallFeatureGrid({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);

  return (
    <div className="small-feature-grid" {...pa('smallFeatures')}>
      {opti.smallFeatures?.map((feature, i) => (
        <OptimizelyComponent opti={feature} key={i} />
      ))}
    </div>
  );
}
