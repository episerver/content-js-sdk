import { contentType, damAssets, Infer } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const SmallFeatureContentType = contentType({
  key: 'SmallFeature',
  baseType: '_component',
  displayName: 'Small feature',
  properties: {
    heading: {
      type: 'string',
    },
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
    },
    body: {
      type: 'richText',
    },
  },
});

type Props = {
  opti: Infer<typeof SmallFeatureContentType>;
};

export default function SmallFeature({ opti }: Props) {
  const { pa, src } = getPreviewUtils(opti);
  const { getAlt } = damAssets(opti);

  return (
    <div className="small-feature-grid">
      <h3 {...pa('heading')}>{opti.heading}</h3>
      <div style={{ position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src(opti.image)}
          alt={getAlt(opti.image, 'image')}
          {...pa('image')}
        />
      </div>
      <RichText content={opti.body?.json} />
    </div>
  );
}
