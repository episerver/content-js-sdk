import { contentType, damAssets, ContentProps } from '@optimizely/cms-sdk';
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
  content: ContentProps<typeof VideoFeatureContentType>;
};

export default function VideoFeature({ content }: Props) {
  const { pa, src } = getPreviewUtils(content);
  const { getAlt } = damAssets(content);

  return (
    <div className="video-feature">
      <div className="video">
        <a href={content.video_link ?? '#'} {...pa('video_link')}>
          {(content.thumbnail_image?.item?.Url ??
            content.thumbnail_image?.url.default) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src(content.thumbnail_image)}
              alt={getAlt(content.thumbnail_image, 'image')}
              {...pa('thumbnail_image')}
            />
          )}
          <span>▶︎</span>
          <p {...pa('thumbnail_caption')}>{content.thumbnail_caption}</p>
        </a>
      </div>
      <div>
        <h3 {...pa('heading')}>{content.heading}</h3>
        <RichText content={content.body?.json} />
      </div>
    </div>
  );
}
