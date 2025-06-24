import { contentType, Infer } from '@episerver/cms-sdk';
import { SmallFeatureContentType } from './SmallFeature';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';

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
