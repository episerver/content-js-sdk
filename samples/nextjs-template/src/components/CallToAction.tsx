import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
export const CallToActionContentType = contentType({
  key: 'CallToAction',
  baseType: '_component',
  displayName: 'Call to Action',
  properties: {
    label: {
      type: 'string',
    },
    link: {
      type: 'string',
    },
  },
  compositionBehaviors: ['elementEnabled'],
});

type Props = {
  content: ContentProps<typeof CallToActionContentType>;
};

export default function CallToAction({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <a href={content.link ?? '#'} {...pa('label')}>
      {content.label}
    </a>
  );
}
