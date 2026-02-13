import { contentType, ContentProps } from '@optimizely/cms-sdk';
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
  content: ContentProps<typeof EditorialContentType>;
};

function Editorial({ content }: EditorialProps) {
  const { pa } = getPreviewUtils(content);
  return <RichText {...pa('main_body')} content={content.main_body?.json} />;
}

export default Editorial;
