import {
  contentType,
  displayTemplate,
  ComponentProps,
} from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import Link from 'next/link';

export const TeaserContentType = contentType({
  key: 'Teaser',
  displayName: 'Teaser',
  baseType: '_component',
  properties: {
    heading: {
      type: 'string',
      displayName: 'Heading',
    },
    text: {
      type: 'string',
      displayName: 'Text',
    },
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Image',
    },
    link: {
      type: 'url',
      displayName: 'Link',
    },
  },
  compositionBehaviors: ['elementEnabled'],
});

// Display Template for Teaser component orientation
export const TeaserDisplayTemplate = displayTemplate({
  key: 'TeaserDisplayTemplate',
  isDefault: false,
  displayName: 'TeaserDisplayTemplate',
  baseType: '_component',
  settings: {
    orientation: {
      editor: 'select',
      displayName: 'Teaser Orientation',
      sortOrder: 0,
      choices: {
        vertical: {
          displayName: 'Vertical',
          sortOrder: 1,
        },
        horizontal: {
          displayName: 'Horizontal',
          sortOrder: 2,
        },
      },
    },
  },
});

type TeaserProps = ComponentProps<typeof TeaserContentType, typeof TeaserDisplayTemplate>;

function Teaser({ content, displaySettings }: TeaserProps) {
  const { pa, src } = getPreviewUtils(content);
  const image = src(content.image);
  // Helper function to wrap content with link if available
  const wrapWithLink = (children: React.ReactNode) => {
    if (content.link?.default) {
      return (
        <Link
          {...pa('link')}
          href={content.link.default}
          className="cursor-pointer"
        >
          {children}
        </Link>
      );
    }
    return children;
  };

  // Horizontal layout
  if (displaySettings?.orientation === 'horizontal') {
    const horizontalContent = (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {content.image?.url.default && (
            <div className="md:w-1/2 h-64 md:h-auto overflow-hidden" {...pa('image')}>
              {image ? (<img
                src={image}
                alt="teaser_image"
                className="w-full h-full object-cover"
              />) : null}
            </div>
          )}
          <div className="md:w-1/2 p-8 flex flex-col justify-center">
            <h2
              {...pa('heading')}
              className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide"
            >
              {content.heading}
            </h2>
            <blockquote
              {...pa('text')}
              className="text-gray-700 text-base leading-relaxed mb-4 italic"
            >
              "{content.text}"
            </blockquote>
          </div>
        </div>
      </div>
    );

    return wrapWithLink(horizontalContent);
  }

  // Vertical layout (default)
  const verticalContent = (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      {content.image?.url.default && (
        <div className="h-48 w-full overflow-hidden" {...pa('image')}>
          <img
            src={content.image?.url.default}
            alt="teaser_image"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6 text-center">
        <h2
          {...pa('heading')}
          className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide"
        >
          {content.heading}
        </h2>
        <p {...pa('text')} className="text-gray-600 text-sm leading-relaxed">
          {content.text}
        </p>
      </div>
    </div>
  );

  return wrapWithLink(verticalContent);
}

export default Teaser;
