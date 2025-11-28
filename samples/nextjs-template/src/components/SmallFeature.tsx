import { contentType, damAssets, Infer } from '@optimizely/cms-sdk';
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
      {opti.image?.url?.default && (
        <div style={{ position: 'relative' }}>
          <img
            src={src(opti.image)}
            alt={getAlt(opti.image, 'image')}
            {...pa('image')}
          />
        </div>
      )}
      <div
        dangerouslySetInnerHTML={{ __html: opti.body?.html ?? '' }}
        {...pa('body')}
      />
    </div>
  );
}
