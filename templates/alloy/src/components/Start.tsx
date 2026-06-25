import { contentType, ContentProps } from '@optimizely/cms-sdk';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComposition,
} from '@optimizely/cms-sdk/react/server';
import { ProductContentType } from './Product';
import { StandardContentType } from './Standard';
import { SEOContentType } from './base/SEO';
import Button, { ButtonContentType } from './base/Button';

export const StartContentType = contentType({
  key: 'Start',
  displayName: 'Start Page',
  baseType: '_experience',
  mayContainTypes: [StandardContentType, ProductContentType],
  description: 'The StartPage content type represents the start page of the website.',
  properties: {
    // Content group
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Teaser Image',
      group: 'Content',
      sortOrder: 3,
    },
    title: {
      type: 'string',
      sortOrder: 1,
      displayName: 'Teaser Title',
      group: 'Content',
    },
    description: {
      type: 'string',
      sortOrder: 2,
      displayName: 'Description',
      group: 'Content',
    },
    button: {
      type: 'component',
      contentType: ButtonContentType,
      displayName: 'Button',
      group: 'Content',
    },

    // Settings group
    hide_site_header: {
      type: 'boolean',
      displayName: 'Hide Site Header',
      group: 'Settings',
    },
    hide_site_footer: {
      type: 'boolean',
      displayName: 'Hide Site Footer',
      group: 'Settings',
    },
    // siteSettings group
    contact_pages: {
      type: 'contentReference',
      allowedTypes: ['_page'],
      displayName: 'Contact Pages',
    },
    global_news: {
      type: 'contentReference',
      allowedTypes: ['_page'],
      displayName: 'Global News',
      group: 'SiteSettings',
    },
    search_page: {
      type: 'contentReference',
      allowedTypes: ['_page'],
      displayName: 'Search Page',
      group: 'SiteSettings',
    },
    logo_type: {
      type: 'contentReference',
      allowedTypes: ['_page'],
      displayName: 'Logo Type',
      group: 'SiteSettings',
    },
    products: {
      type: 'array',
      items: {
        type: 'link',
      },
      displayName: 'Products',
      group: 'SiteSettings',
    },
    company_information: {
      type: 'array',
      items: {
        type: 'link',
      },
      displayName: 'Company Information',
      group: 'SiteSettings',
    },
    local_news: {
      type: 'array',
      items: {
        type: 'link',
      },
      displayName: 'Local News',
      group: 'SiteSettings',
    },
    customer_zone: {
      type: 'array',
      items: {
        type: 'link',
      },
      displayName: 'Customer Zone',
      group: 'SiteSettings',
    },
    seo_properties: {
      type: 'component',
      contentType: SEOContentType,
      displayName: 'SEO',
    },
  },
});

type StartProps = {
  content: ContentProps<typeof StartContentType>;
};

function Start({ content }: StartProps) {
  const { pa, src } = getPreviewUtils(content);
  const image = src(content.image);

  return (
    <>
      <div className='relative w-full h-40 sm:h-50 md:h-48 lg:h-120 rounded-sm overflow-hidden'>
        {/* Hero Image */}
        {image && (
          <img
            {...pa('image')}
            src={image}
            alt={content.title || 'Hero image'}
            className='w-full h-full object-cover object-center'
          />
        )}

        {/* Dark overlay */}
        <div className='absolute inset-0 bg-black/40' />

        {/* Content positioned at top */}
        <div className='absolute top-10 left-0 right-0 z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8 lg:py-12 w-full'>
          <div className='max-w-3xl'>
            <h1
              {...pa('title')}
              className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight'
            >
              {content.title}
            </h1>

            {content.description && (
              <p
                {...pa('description')}
                className='text-base sm:text-lg md:text-xl text-white mb-6 sm:mb-7 md:mb-8 leading-relaxed max-w-2xl font-light'
              >
                {content.description}
              </p>
            )}

            {content.button && (
              <div {...pa('button')}>
                <Button content={content.button} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='bg-white'>
        <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8 lg:py-12'>
          <div className='flex flex-col space-y-6 sm:space-y-8'>
            <OptimizelyComposition nodes={content.composition.nodes ?? []} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Start;
