import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyComposition,
} from '@optimizely/cms-sdk/react/server';
import { SEOContentType } from './base/SEO';

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
    seo_properties: {
      type: 'component',
      contentType: SEOContentType,
      displayName: 'SEO',
    },
  },
});

type ProductProps = {
  content: ContentProps<typeof ProductContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <div {...pa(node)} className="w-full block">
      {children}
    </div>
  );
}

function Product({ content }: ProductProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:gap-10 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Heading and Description */}
            <div className="space-y-3 sm:space-y-4">
              <h1
                {...pa('heading')}
                className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-5xl"
              >
                {content.heading}
              </h1>
              <p
                {...pa('description')}
                className="text-base leading-relaxed text-gray-700 sm:text-lg md:text-xl"
              >
                {content.description}
              </p>
            </div>

            {/* Main Body Content */}
            <RichText
              {...pa('main_body')}
              content={content.main_body?.json}
              className="space-y-4 sm:space-y-6"
            />
          </div>

          {/* Sidebar */}
          <div {...pa('content_area')} className="space-y-6 sm:space-y-8">
            {content.content_area?.map((contentItem, index) => {
              return <OptimizelyComponent key={index} content={contentItem} />;
            })}
          </div>
          <div className="flex flex-col space-y-6 sm:space-y-8">
            <OptimizelyComposition
              nodes={content.composition.nodes ?? []}
              ComponentWrapper={ComponentWrapper}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Product;
