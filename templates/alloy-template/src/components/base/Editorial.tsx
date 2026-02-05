import { contentType, Infer } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const EditorialContentType = contentType({
  key: 'Editorial',
  displayName: 'Editorial',
  baseType: '_component',
  properties: {
    main_body: {
      type: 'richText',
      displayName: 'Main Body',
    },
  },
  compositionBehaviors: ['elementEnabled'],
});

type EditorialProps = {
  opti: Infer<typeof EditorialContentType>;
};

function Editorial({ opti }: EditorialProps) {
  const { pa } = getPreviewUtils(opti);
  return (
    <div {...pa('main_body')}>
      <RichText content={opti.main_body?.json} />
    </div>
  );
}

export default Editorial;
