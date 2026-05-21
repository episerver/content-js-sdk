import { ContentProps, damAssets } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { StandardContentType } from '../Standard';
import Link from 'next/link';

type StandardTeaserProps = {
  content: ContentProps<typeof StandardContentType>;
};

function StandardTeaser({ content }: StandardTeaserProps) {
  const { pa, src } = getPreviewUtils(content);
  const { getAlt } = damAssets(content);

  const href = content._metadata.url.default || '#';

  return (
    <Link
      href={href}
      className='group grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6  items-start w-full hover:opacity-90 transition-opacity'
    >
      {/* Image Section */}
      <div {...pa('image')} className='w-full h-48'>
        {content.image ?
          <img
            src={src(content.image)}
            alt={getAlt(content.image, 'Teaser Image')}
            className='w-full h-48 object-cover rounded-lg'
          />
        : <div
            className='w-full h-48 flex items-center justify-center rounded-lg'
            style={{ backgroundColor: 'rgb(255 175 32 / 55%)' }}
          >
            <img src={'/logo.png'} className='w-18 h-18 object-cover rounded-lg' />
          </div>
        }
      </div>

      {/* Content Section */}
      <div className='mx-2'>
        <h2
          {...pa('heading')}
          className='text-lg md:text-xl lg:text-2xl font-bold text-gray-900 uppercase tracking-tight group-hover:text-teal-600 transition-colors'
        >
          {content.heading}
        </h2>
        <p
          {...pa('description')}
          className='text-xs md:text-sm lg:text-base text-gray-700 leading-relaxed'
        >
          {content.description}
        </p>
      </div>
    </Link>
  );
}

export default StandardTeaser;
