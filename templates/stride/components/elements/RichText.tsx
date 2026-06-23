import { ContentProps, contentType } from '@optimizely/cms-sdk';
import { RichText as OptiRichText } from '@optimizely/cms-sdk/react/richText';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import EditableField from '../EditableField';

export const RichTextComponent = contentType({
  key: 'RichTextElement',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  displayName: 'Rich Text',
  description: 'Formattable text.',
  properties: {
    body: {
      type: 'richText',
      displayName: 'Body',
      isLocalized: true,
      sortOrder: 1,
      editorSettings: {
        preset: 'minimal',
      },
    },
  },
});

type RichTextComponentProps = {
  content: ContentProps<typeof RichTextComponent>;
};

export default function RichText({ content }: RichTextComponentProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <EditableField field={content.body}>
      <OptiRichText
        {...pa('body')}
        content={content.body?.json}
        className='text-lg leading-relaxed text-foreground max-w-2xl'
      />
    </EditableField>
  );
}
