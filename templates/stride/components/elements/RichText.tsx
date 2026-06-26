import { ContentProps, contentType } from '@optimizely/cms-sdk';
import { RichText as OptiRichText } from '@optimizely/cms-sdk/react/richText';
import { CmsField } from '../shared/CmsField';

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
  return (
    <CmsField content={content} field={c => c.body}>
      <OptiRichText
        content={content.body?.json}
        className='text-lg leading-relaxed text-foreground max-w-2xl'
      />
    </CmsField>
  );
}
