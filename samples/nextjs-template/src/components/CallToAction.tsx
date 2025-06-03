import { contentType, Infer } from 'optimizely-cms-sdk';
import { getPreviewAttrs as pa } from 'optimizely-cms-sdk/dist/render/react';
export const CallToActionContentType = contentType({
  key: 'CallToAction',
  baseType: 'component',
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
  opti: Infer<typeof CallToActionContentType>;
};

export default function CallToAction({ opti }: Props) {
  return (
    <a href={opti.link} {...pa('label')}>
      {opti.label}
    </a>
  );
}
