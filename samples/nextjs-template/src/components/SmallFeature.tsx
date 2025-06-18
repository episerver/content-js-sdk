import { contentType, Infer } from '@episerver/cms-sdk';
import { getPreviewUtils } from '@episerver/cms-sdk/dist/render/react';

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

  return (
    <div className="small-feature-grid">
      <h3 {...pa('heading')}>{opti.heading}</h3>
      {opti.image?.url?.default && (
        <div style={{ position: 'relative' }}>
          <img src={src(opti.image.url.default)} alt="" {...pa('image')} />
        </div>
      )}
      <div
        dangerouslySetInnerHTML={{ __html: opti.body?.html ?? '' }}
        {...pa('body')}
      />
    </div>
  );
}
