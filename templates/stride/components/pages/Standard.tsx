import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import { bindCmsField } from '../shared/CmsField';
import SubNavigationLayout from '../layouts/SubNavigationLayout';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';

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
    extras: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: ['_component', '_experience'],
      },
    },
  },
});

type StandardPageProps = {
  content: ContentProps<typeof StandardPage>;
};

export default function Standard({ content }: StandardPageProps) {
  const CmsField = bindCmsField(content);

  return (
    <SubNavigationLayout>
      <CmsField field={c => c.heading} alwaysRender>
        <h1 className='text-5xl md:text-7xl font-bold tracking-tight mb-12'>
          {content.heading ?? content._metadata.displayName}
        </h1>
      </CmsField>

      <CmsField field={c => c.intro}>
        <RichText
          content={content.intro?.json}
          className='leading-relaxed text-foreground mt-5 max-w-2xl mb-8 text-xl'
        />
      </CmsField>

      <CmsField field={c => c.body}>
        <RichText content={content.body?.json} className='prose' />
      </CmsField>

      {content.extras ?
        content.extras.map((extra, index) => (
          <OptimizelyComponent content={extra} key={`extra-${index + 1}`} />
        ))
      : null}
    </SubNavigationLayout>
  );
}
