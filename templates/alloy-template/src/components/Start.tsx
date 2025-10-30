import { contentType, Infer } from '@optimizely/cms-sdk';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyExperience,
} from '@optimizely/cms-sdk/react/server';
import { ProductContentType } from './Product';
import { StandardContentType } from './Standard';

export const StartPageContentType = contentType({
  key: 'StartPage',
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
      displayName: 'Title',
      group: 'Information',
    },
    description: {
      type: 'string',
      displayName: 'Description',
      group: 'Information',
    },
    button_link: {
      type: 'url',
      displayName: 'Button Link',
      group: 'Information',
    },
    button_text: {
      type: 'string',
      displayName: 'Button Text',
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
    // Metadata group
    site_title: {
      type: 'string',
      displayName: 'Title',
    },
    keywords: {
      type: 'string',
      displayName: 'Keywords',
    },
    page_description: {
      type: 'string',
      displayName: 'Page Description',
    },
    disable_indexing: {
      type: 'boolean',
      displayName: 'Disable Indexing',
    },
    // siteSettings group
    content_pages: {
      type: 'contentReference',
      allowedTypes: ['_page'],
      displayName: 'Content Pages',
    },
    global_news: {
      type: 'contentReference',
      allowedTypes: ['_page'],
      displayName: 'Global News',
    },
    logo_type: {
      type: 'contentReference',
      allowedTypes: ['_page'],
      displayName: 'Logo Type',
    },
    search_page: {
      type: 'contentReference',
      allowedTypes: ['_page'],
      displayName: 'Search Page',
    },
    products: {
      type: 'array',
      items: {
        type: 'link',
      },
      displayName: 'Products',
    },
    company_information: {
      type: 'array',
      items: {
        type: 'link',
      },
      displayName: 'Company Information',
    },
    local_news: {
      type: 'array',
      items: {
        type: 'link',
      },
      displayName: 'Local News',
    },
    customer_zone: {
      type: 'array',
      items: {
        type: 'link',
      },
      displayName: 'Customer Zone',
    },
  },
});

type StartPageProps = {
  opti: Infer<typeof StartPageContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

function StartPage({ opti }: StartPageProps) {
  const { pa } = getPreviewUtils(opti);

  console.log(opti.image?.url.default);

  return (
    <>
      <div
        style={{ backgroundImage: `url(${opti.image?.url.default})` }}
        className="relative h-[60vh] w-full flex items-center bg-cover bg-center rounded-sm"
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            {/* Large Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              {opti.title}
            </h1>

            {/* Description */}
            {opti.description && (
              <p className="text-lg md:text-xl text-white mb-8 leading-relaxed max-w-2xl font-light">
                {opti.description}
              </p>
            )}

            {/* Call to Action Button */}
            {opti.button_link && opti.button_text && (
              <a
                href={opti.button_link.default ?? undefined}
                className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-8 rounded-md transition-colors duration-200 text-base"
              >
                {opti.button_text}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="my-5">
        <OptimizelyExperience
          nodes={opti.composition.nodes ?? []}
          ComponentWrapper={ComponentWrapper}
        />
      </div>
    </>
  );
}

export default StartPage;
