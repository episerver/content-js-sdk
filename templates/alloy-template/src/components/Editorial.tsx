import { contentType, Infer } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';

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
});

type EditorialProps = {
  opti: Infer<typeof EditorialContentType>;
};

function Editorial({ opti }: EditorialProps) {
  return (
    <>
      <RichText content={opti.main_body?.json} />
    </>
  );
}

export default Editorial;
