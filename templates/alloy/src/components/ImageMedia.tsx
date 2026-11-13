import { contentType, ContentProps } from '@optimizely/cms-sdk';

export const ImageMediaContentType = contentType({
  key: 'ImageMedia',
  displayName: 'Image Media',
  baseType: '_image',
  properties: {
    AltText: { type: 'string', displayName: 'Alt text' },
  },
});

export type ImageMediaProps = ContentProps<typeof ImageMediaContentType>;

// Media types render no component; this export satisfies the components glob.
export default function ImageMedia() {
  return null;
}
