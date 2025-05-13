import { contentType, Infer } from 'optimizely-cms-sdk';
import { OptiImage } from 'optimizely-cms-sdk/dist/preview/react';

export const VideoFeatureContentType = contentType({
  key: 'VideoFeature',
  baseType: 'component',
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
      allowedTypes: ['_Image'],
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
  return (
    <div className="video-feature">
      <div className="video">
        <a href={opti.video_link}>
          <OptiImage src={opti.thumbnail_image.url.default} alt="" />
          <span>▶︎</span>
          <p>{opti.thumbnail_caption}</p>
        </a>
      </div>
      <div>
        <h3>{opti.heading}</h3>
        <div dangerouslySetInnerHTML={{ __html: opti.body.html }} />
      </div>
    </div>
  );
}
