import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import { bindCmsField } from '../shared/CmsField';
import Eyebrow, { EyebrowComponent } from '../blocks/Eyebrow';
import FullWidthLayout from '../layouts/FullWidthLayout';
import { OptimizelyComposition } from '@optimizely/cms-sdk/react/server';
import { ImageComponent } from '../elements/Image';
import { ImageCardComponent } from '../elements/ImageCard';

export const ProductPage = contentType({
  key: 'ProductPage',
  baseType: '_experience',
  displayName: 'Product Page',
  description: 'Page with hero, text, and sidebar.',
  mayContainTypes: ['*'],
  properties: {
    heading: {
      type: 'string',
      displayName: 'Heading',
      isLocalized: true,
      sortOrder: 1,
    },
    eyebrow: {
      type: 'component',
      contentType: EyebrowComponent,
      displayName: 'Eyebrow',
      sortOrder: 2,
    },
    intro: {
      type: 'richText',
      displayName: 'Introduction',
      isLocalized: true,
      sortOrder: 3,
      editorSettings: {
        preset: 'minimal',
      },
    },
    backgroundImage: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Background image',
      isLocalized: false,
      sortOrder: 4,
    },
    body: {
      type: 'richText',
      displayName: 'Body',
      isLocalized: true,
      sortOrder: 5,
      editorSettings: {
        preset: 'expanded',
      },
    },
    sidebar: {
      // Unrestricted: editors may place any element in the sidebar.
      type: 'composition',
      format: 'grid',
      displayName: 'Sidebar',
      sortOrder: 6,
    },
    gallery: {
      // Restricted so the grid below keeps its shape: it lays every node out
      // in equal cells, which only works for images.
      type: 'composition',
      format: 'grid',
      displayName: 'Gallery',
      sortOrder: 7,
      allowedTypes: [ImageComponent, ImageCardComponent],
    },
  },
});

type ProductPageProps = {
  content: ContentProps<typeof ProductPage>;
};

export default function Product({ content }: ProductPageProps) {
  const CmsField = bindCmsField(content);

  const backgroundImage =
    content.backgroundImage?.url?.default ?
      { backgroundImage: `url("${content.backgroundImage.url.default}")` }
    : undefined;

  return (
    <FullWidthLayout>
      <section>
        <div
          className='bg-cover bg-center bg-no-repeat overflow-hidden relative'
          style={backgroundImage}
        >
          {backgroundImage && (
            <div className='absolute bg-background2/40 inset-0 pointer-events-none bg-linear-to-t from-background2 via-transparent to-transparent pt-50' />
          )}

          <div className='relative z-10 container flex flex-col items-center text-center pt-50 pb-20'>
            {content.eyebrow && <Eyebrow content={content.eyebrow} />}

            <CmsField field={c => c.heading}>
              <h1 className='text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-tight! mb-8 drop-shadow-[white_0px_0px_25px]'>
                {content.heading ?? content._metadata.displayName}
              </h1>
            </CmsField>

            <CmsField field={c => c.intro}>
              <RichText
                content={content.intro?.json}
                className='text-lg leading-relaxed text-foreground mt-5 max-w-2xl mx-auto'
              />
            </CmsField>
          </div>
        </div>
      </section>

      <div className='container mx-auto py-20'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          <div className='lg:col-span-8 space-y-12'>
            <CmsField field={c => c.body}>
              <RichText content={content.body?.json} className='prose' />
            </CmsField>
          </div>

          <div className='lg:col-span-4 space-y-6'>
            <OptimizelyComposition nodes={content.sidebar?.nodes ?? []} />
          </div>
        </div>
      </div>

      {content.gallery?.nodes?.length ?
        <section className='container mx-auto pb-20'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <OptimizelyComposition nodes={content.gallery.nodes} />
          </div>
        </section>
      : null}

      <OptimizelyComposition nodes={content.composition.nodes ?? []} />
    </FullWidthLayout>
  );
}
