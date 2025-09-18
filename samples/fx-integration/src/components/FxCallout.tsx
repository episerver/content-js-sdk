import { contentType, Infer } from '@episerver/cms-sdk';
import { FxCallToActionCT } from './FxCallToAction';

export const FxCalloutCT = contentType({
  key: 'FxCallout',
  displayName: 'Fx Callout',
  baseType: '_component',
  properties: {
    highlightText: { type: 'string' },
    normalText: { type: 'string' },
    ctas: {
      type: 'array',
      items: { type: 'content', allowedTypes: [FxCallToActionCT] },
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

type Props = {
  opti: Infer<typeof FxCalloutCT>;
};

export default function FxCallout({ opti }: Props) {
  return <></>;
}
