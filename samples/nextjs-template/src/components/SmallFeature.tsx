import { contentType, Infer } from 'optimizely-cms-sdk';
import { OptiImage } from 'optimizely-cms-sdk/dist/preview/react';

export const SmallFeatureContentType = contentType({
  key: 'SmallFeature',
  baseType: 'component',
  displayName: 'Small feature',
  properties: {
    heading: {
      type: 'string',
    },
    image: {
      type: 'contentReference',
      allowedTypes: ['_Image'],
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
  return (
    <div className="small-feature-grid">
      <h3>{opti.heading}</h3>
      {opti.image?.url?.default && (
        <div style={{ position: 'relative' }}>
          <OptiImage src={opti.image.url.default} alt="" />
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: opti.body.html }} />
    </div>
  );
}
