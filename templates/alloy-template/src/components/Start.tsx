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
  description:
    'The StartPage content type represents the start page of the website.',
  properties: {
    // Content group
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Teaser Image',
      group: 'Information',
    },
    title: {
      type: 'string',
      displayName: 'Teaser Title',
      group: 'Information',
    },
    description: {
      type: 'string',
      displayName: 'Description',
      group: 'Information',
    },
    button: {
      type: 'component',
      contentType: ButtonContentType,
      displayName: 'Button',
      group: 'Information',
    },

    // Settings group
    hide_site_header: {
      type: 'boolean',
      displayName: 'Hide Site Header',
      group: 'Advanced',
    },
    hide_site_footer: {
      type: 'boolean',
      displayName: 'Hide Site Footer',
      group: 'Advanced',
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

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)} className="w-full block">{children}</div>;
}

function Start({ content }: StartProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <>
      <div
        {...pa('image')}
        style={{ backgroundImage: `url(${content.image?.url.default})` }}
        className="relative min-h-96 sm:min-h-112 md:min-h-128 lg:min-h-144 w-full flex items-center bg-cover bg-center rounded-sm"
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8 lg:py-12 w-full">
          <div className="max-w-3xl">
            {/* Large Heading */}
            <h1
              {...pa('title')}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight"
            >
              {content.title}
            </h1>

            {/* Description */}
            {content.description && (
              <p
                {...pa('description')}
                className="text-base sm:text-lg md:text-xl text-white mb-6 sm:mb-7 md:mb-8 leading-relaxed max-w-2xl font-light"
              >
                {content.description}
              </p>
            )}
            {/* Button */}
            {content.button && (
              <div {...pa('button')}>
                <Button content={content.button} />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8 lg:py-12">
          <div className="flex flex-col space-y-6 sm:space-y-8">
            <OptimizelyComposition
              nodes={content.composition.nodes ?? []}
              ComponentWrapper={ComponentWrapper}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Start;
