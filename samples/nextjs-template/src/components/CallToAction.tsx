import { contentType, Infer } from '@episerver/cms-sdk';
import { getPreviewUtils } from '@episerver/cms-sdk/dist/render/react';
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
  const { pa } = getPreviewUtils(opti);

  return (
    <a href={opti.link ?? '#'} {...pa('label')}>
      {opti.label}
    </a>
  );
}
