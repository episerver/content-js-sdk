import { ContentProps, contentType } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import EditableField from '../EditableField';

export const ImageComponent = contentType({
  key: 'ImageElement',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  displayName: 'Image',
  description: 'Image',
  properties: {
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Image',
      sortOrder: 1,
    },
    alternativeText: {
      type: 'string',
      displayName: 'Alternative Text',
      sortOrder: 2,
    },
  },
});

type ImageComponentProps = {
  content: ContentProps<typeof ImageComponent>;
};

export default function Image({ content }: ImageComponentProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <EditableField field={content.image}>
      <img
        src={content.image?.url.default ?? ''}
        alt={content.alternativeText ?? ''}
        className='object-cover object-top aspect-square'
        {...pa('image')}
      />
    </EditableField>
  );
}
