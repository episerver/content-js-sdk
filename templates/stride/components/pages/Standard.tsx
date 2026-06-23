import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import EditableField from '../EditableField';
import SubNavigationLayout from '../layout/SubNavigationLayout';

export const StandardPage = contentType({
  key: 'StandardPage',
  baseType: '_page',
  displayName: 'Standard Page',
  description: 'Page with text, sidebar, and sub-navigation.',
  mayContainTypes: ['*'],
  properties: {
    heading: {
      type: 'string',
      displayName: 'Heading',
      isLocalized: true,
      sortOrder: 1,
    },
    intro: {
      type: 'richText',
      displayName: 'Introduction',
      isLocalized: true,
      sortOrder: 2,
      editorSettings: {
        preset: 'minimal',
      },
    },
    body: {
      type: 'richText',
      displayName: 'Body',
      isLocalized: true,
      sortOrder: 3,
      editorSettings: {
        preset: 'expanded',
      },
    },
  },
});

type StandardPageProps = {
  content: ContentProps<typeof StandardPage>;
};

export default function Standard({ content }: StandardPageProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <SubNavigationLayout>
      <h1
        className='text-5xl md:text-7xl font-bold tracking-tight mb-12'
        {...pa('heading')}
      >
        {content.heading ?? content._metadata.displayName}
      </h1>

      <EditableField field={content.intro}>
        <RichText
          {...pa('intro')}
          content={content.intro?.json}
          className='leading-relaxed text-foreground mt-5 max-w-2xl mb-8 text-xl'
        />
      </EditableField>

      <EditableField field={content.body}>
        <RichText {...pa('body')} content={content.body?.json} className='prose' />
      </EditableField>
    </SubNavigationLayout>
  );
}
