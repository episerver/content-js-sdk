import { contentType, Infer } from '@episerver/cms-sdk';
import { FxCallToActionCT } from './FxCallToAction';
import FxText, { FxTextCt } from './FxText';

export const FxCalloutCT = contentType({
  key: 'FxCallout',
  displayName: 'Fx Callout',
  baseType: '_component',
  properties: {
    text: { type: 'content', allowedTypes: [FxTextCt] },
    ctas: {
      type: 'array',
      items: { type: 'content', allowedTypes: [FxCallToActionCT] },
    },
  },
});

type Props = {
  opti: Infer<typeof FxCalloutCT>;
};

export default function FxCallout({ opti }: Props) {
  return <></>;
}
