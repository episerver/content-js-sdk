import { contentType, damAssets, ContentProps } from '@optimizely/cms-sdk';
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
  content: ContentProps<typeof SmallFeatureContentType>;
};

export default function SmallFeature({ content }: Props) {
  const { pa, src } = getPreviewUtils(content);
  const { getAlt } = damAssets(content);

  return (
    <div className="small-feature-grid">
      <h3 {...pa('heading')}>{content.heading}</h3>
      <div style={{ position: 'relative' }}>
        {(content.image?.item?.Url ?? content.image?.url.default) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src(content.image)}
            alt={getAlt(content.image, 'image')}
            {...pa('image')}
          />
        )}
      </div>
      <RichText content={content.body?.json} />
    </div>
  );
}
