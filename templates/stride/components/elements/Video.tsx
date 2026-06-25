import { ContentProps, contentType } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import EditableField from '../EditableField';

export const VideoComponent = contentType({
  key: 'VideoElement',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  displayName: 'Video',
  description: 'Video',
  properties: {
    video: {
      type: 'contentReference',
      allowedTypes: ['_video'],
      displayName: 'Video',
      sortOrder: 1,
    },
    autoplay: {
      type: 'boolean',
      displayName: 'Autoplay',
      sortOrder: 2,
    },
  },
});

type VideoComponentProps = {
  content: ContentProps<typeof VideoComponent>;
};

export default function Video({ content }: VideoComponentProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <EditableField field={content.video}>
      <video
        src={content.video?.url.default ?? ''}
        autoPlay={content.autoplay ?? false}
        loop
        muted
        className='absolute inset-0 w-full h-full object-cover rounded-lg'
        {...pa('video')}
      />
    </EditableField>
  );
}
