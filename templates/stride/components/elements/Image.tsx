import { ContentProps, contentType } from '@optimizely/cms-sdk';
import { CmsField } from '../shared/CmsField';

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
  return (
    <CmsField content={content} field={c => c.image}>
      <img
        src={content.image?.url.default ?? ''}
        alt={content.alternativeText ?? ''}
        className='object-cover object-top aspect-square'
      />
    </CmsField>
  );
}
