import { ContentProps, contentType } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const TeaserCardComponent = contentType({
  key: 'TeaserCardComponent',
  displayName: 'Teaser Card',
  baseType: '_component',
  properties: {
    heading: {
      type: 'string',
      displayName: 'Teaser Text',
    },
    description: {
      type: 'string',
      displayName: 'Teaser Description',
    },
    image: {
      type: 'contentReference',
      displayName: 'Teaser Image',
      allowedTypes: ['_image'],
    },
    link: {
      type: 'contentReference',
      allowedTypes: ['_page', '_experience'],
    },
  },
});

type TeaserCardComponentProps = {
  content: ContentProps<typeof TeaserCardComponent>;
};

export default function TeaserCard({ content }: TeaserCardComponentProps) {
  const { src } = getPreviewUtils(content);
  return (
    <article className='group flex gap-6'>
      <div className='grow basis-0'>
        <img
          className='mb-4 rounded-lg object-cover max-h-60 w-full border border-white/5 '
          src={src(content.image)}
        />
      </div>
      <div className='grow basis-0'>
        <a href={content.link?.url.default ?? '#'}>
          <h3 className='text-2xl font-bold tracking-tight !mb-2 group-hover:text-key1 transition-colors cursor-pointer'>
            {content.heading}
          </h3>
        </a>
        <p className='text-lg leading-relaxed text-foreground mt-5 max-w-2xl'>
          {content.description}
        </p>
      </div>
    </article>
  );
}
