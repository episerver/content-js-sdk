import { contentType, Infer } from 'optimizely-cms-sdk';
import { SmallFeatureContentType } from './SmallFeature';
import { OptimizelyComponent } from 'optimizely-cms-sdk/dist/render/react';

export const SmallFeatureGridContentType = contentType({
  key: 'SmallFeatureGrid',
  displayName: 'Small feature grid',
  baseType: 'component',
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
  return (
    <div className="small-feature-grid">
      {opti.smallFeatures?.map((feature, i) => (
        <OptimizelyComponent opti={feature} key={i} />
      ))}
    </div>
  );
}
