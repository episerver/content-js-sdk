import { contentType, ContentProps, damAssets } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComposition,
} from '@optimizely/cms-sdk/react/server';
import { StandardContentType } from './Standard';
import { SEOContentType } from './base/SEO';

export const NewsContentType = contentType({
  key: 'News',
  displayName: 'News Page',
  baseType: '_experience',
  mayContainTypes: [StandardContentType],
  properties: {
    image: {
      type: 'contentReference',
      displayName: 'Teaser Image',
    },
    title: {
      type: 'string',
      displayName: 'Teaser Text',
    },
    description: {
      type: 'string',
      displayName: 'Description',
    },
    main_body: {
      type: 'richText',
      displayName: 'Main Body',
    },
    seo_properties: {
      type: 'component',
      contentType: SEOContentType,
      displayName: 'SEO',
    },
  },
});

type NewsPageProps = {
  opti: ContentProps<typeof NewsContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

function News({ opti }: NewsPageProps) {
  const { pa, src } = getPreviewUtils(opti);
  const { getAlt, getSrcset } = damAssets(opti);
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Heading and Description */}
            <div className="space-y-3 sm:space-y-4">
              <h1
                {...pa('title')}
                className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-5xl"
              >
                {opti.title}
              </h1>
              <p
                {...pa('description')}
                className="text-base leading-relaxed text-gray-700 sm:text-lg md:text-xl"
              >
                {opti.description}
              </p>
            </div>

            {/* Main Body Content */}
            <RichText
              {...pa('main_body')}
              content={opti.main_body?.json}
              className="space-y-4 sm:space-y-6"
            />

            <img
              {...pa('image')}
              src={src(opti.image)}
              alt={getAlt(opti.image, 'Teaser Image')}
              className="h-auto w-full rounded-lg object-cover sm:max-h-100 md:max-h-125 lg:max-h-150"
            />
          </div>

          <OptimizelyComposition
            nodes={opti.composition.nodes ?? []}
            ComponentWrapper={ComponentWrapper}
          />
        </div>
      </div>
    </main>
  );
}

export default News;
