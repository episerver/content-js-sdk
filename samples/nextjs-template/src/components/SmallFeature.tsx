import { contentType, Infer } from 'optimizely-cms-sdk';

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
      {opti.image?.url?.default && <img src={opti.image.url.default} alt="" />}
      <div dangerouslySetInnerHTML={{ __html: opti.body.html }} />
    </div>
  );
}
