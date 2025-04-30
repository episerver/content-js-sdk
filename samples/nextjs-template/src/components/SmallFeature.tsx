import { contentType, Infer } from 'optimizely-cms-sdk';
import Image from 'next/image';

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
      allowedTypes: ['Image'],
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
          <Image src={opti.image.url.default} alt="" fill />
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: opti.body.html }} />
    </div>
  );
}
