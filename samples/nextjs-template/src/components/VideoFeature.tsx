import { contentType, damAssets, Infer } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const VideoFeatureContentType = contentType({
  key: 'VideoFeature',
  baseType: '_component',
  displayName: 'Video Feature',
  properties: {
    heading: {
      type: 'string',
    },
    body: {
      type: 'richText',
    },
    thumbnail_image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
    },
    thumbnail_caption: {
      type: 'string',
    },
    video_link: {
      type: 'string',
    },
  },
});

type Props = {
  opti: Infer<typeof VideoFeatureContentType>;
};

export default function VideoFeature({ opti }: Props) {
  const { pa, src } = getPreviewUtils(opti);
  const { getAlt } = damAssets(opti);

  return (
    <div className="video-feature">
      <div className="video">
        <a href={opti.video_link ?? '#'} {...pa('video_link')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {(opti.thumbnail_image?.item?.Url ??
            opti.thumbnail_image?.url.default) && (
            <img
              src={src(opti.thumbnail_image)}
              alt={getAlt(opti.thumbnail_image, 'image')}
              {...pa('thumbnail_image')}
            />
          )}
          <span>▶︎</span>
          <p {...pa('thumbnail_caption')}>{opti.thumbnail_caption}</p>
        </a>
      </div>
      <div>
        <h3 {...pa('heading')}>{opti.heading}</h3>
        <RichText content={opti.body?.json} />
      </div>
    </div>
  );
}
