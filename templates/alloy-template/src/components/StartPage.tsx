import { contentType, Infer } from '@optimizely/cms-sdk';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyExperience,
} from '@optimizely/cms-sdk/react/server';
import { ProductContentType } from './Product';
import { StandardContentType } from './StandardPage';

export const StartPageContentType = contentType({
  key: 'StartPage',
  displayName: 'Start Page',
  baseType: '_experience',
  mayContainTypes: [StandardContentType, ProductContentType],
  description:
    'The StartPage content type represents the start page of the website.',
  properties: {
    // Content group
    teaser_image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Teaser Image',
      group: 'Information',
    },
    teaser_text: {
      type: 'string',
      displayName: 'Teaser Text',
      group: 'Information',
    },
    large_content_area: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: ['_component'],
      },
      displayName: 'Large Content Area',
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
    title: {
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
  return (
    <div>
      <div
        {...pa('large_content_area')}
        className="space-y-8 my-8 flex flex-col"
      >
        {opti?.large_content_area &&
          opti.large_content_area.map((item, i) => (
            <OptimizelyComponent opti={item} key={i} />
          ))}
      </div>

      <OptimizelyExperience
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </div>
  );
}

export default StartPage;
