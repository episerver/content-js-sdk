import { contentType, Infer } from 'optimizely-cms-sdk';
import {
  getPreviewAttrs as pa,
  getSecureImageSrc,
} from 'optimizely-cms-sdk/dist/render/react';

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
      <h3 {...pa('heading')}>{opti.heading}</h3>
      {opti.image?.url?.default && (
        <div style={{ position: 'relative' }}>
          <img
            src={getSecureImageSrc(opti.image.url.default)}
            alt=""
            {...pa('image')}
          />
        </div>
      )}
      <div
        dangerouslySetInnerHTML={{ __html: opti.body.html }}
        {...pa('body')}
      />
    </div>
  );
}
