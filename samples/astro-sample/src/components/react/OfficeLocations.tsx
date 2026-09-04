import type { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { OfficeContentType } from '@/lib/contentTypes';

type Props = {
  content: ContentProps<typeof OfficeContentType>;
};

export default function OfficeLocations({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <section className='office-locations'>
      <h1 className='office-locations__title' {...pa('title')}>
        {content.title}
      </h1>
      <p className='office-locations__subtitle' {...pa('subtitle')}>
        {content.subtitle}
      </p>
      <div className='office-locations__list' {...pa('offices')}>
        {(content.offices ?? []).map((office, i) => (
          <OptimizelyComponent content={office} key={i} />
        ))}
      </div>
    </section>
  );
}
