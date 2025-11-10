import { contentType, Infer } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyExperience,
} from '@optimizely/cms-sdk/react/server';

export const ProductContentType = contentType({
  key: 'Product',
  displayName: 'Product Page',
  baseType: '_experience',
  properties: {
    heading: {
      type: 'string',
      displayName: 'Heading',
    },
    description: {
      type: 'string',
      displayName: 'Description',
    },
    main_body: {
      type: 'richText',
      displayName: 'Main Body',
    },
    title: {
      type: 'string',
      displayName: 'Title',
    },
    content_area: {
      type: 'array',
      items: {
        type: 'content',
      },
      displayName: 'Content Area',
    },
    // SEO group
    site_title: {
      type: 'string',
      displayName: 'Title',
      group: 'SEO',
    },
    keywords: {
      type: 'array',
      items: {
        type: 'string',
      },
      displayName: 'Keywords',
      group: 'SEO',
    },
    page_description: {
      type: 'string',
      displayName: 'Page Description',
      group: 'SEO',
    },
    disable_indexing: {
      type: 'boolean',
      displayName: 'Disable Indexing',
      group: 'SEO',
    },
  },
});

type ProductProps = {
  opti: Infer<typeof ProductContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

function Product({ opti }: ProductProps) {
  const { pa } = getPreviewUtils(opti);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Heading and Description */}
            <div className="space-y-4">
              <h1
                {...pa('heading')}
                className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
              >
                {opti.heading}
              </h1>
              <p
                {...pa('description')}
                className="text-lg leading-relaxed text-gray-700"
              >
                {opti.description}
              </p>
            </div>

            {/* Main Body Content */}
            <div className="space-y-6">
              <RichText {...pa('main_body')} content={opti.main_body?.json} />
            </div>
          </div>

          {/* Sidebar */}
          <div {...pa('content_area')} className="space-y-8">
            {opti.content_area?.map((contentItem, index) => {
              return <OptimizelyComponent key={index} opti={contentItem} />;
            })}
          </div>
          <OptimizelyExperience
            nodes={opti.composition.nodes ?? []}
            ComponentWrapper={ComponentWrapper}
          />
        </div>
      </div>
    </main>
  );
}

export default Product;
