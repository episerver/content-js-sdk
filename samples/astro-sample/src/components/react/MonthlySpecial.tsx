import type { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { MonthlySpecialContentType } from '@/lib/contentTypes';

type Props = {
  content: ContentProps<typeof MonthlySpecialContentType>;
};

export default function MonthlySpecial({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div className='monthly-special'>
      <div className='monthly-special__content'>
        <h1 className='monthly-special__title' {...pa('title')}>
          {content.title}
        </h1>
        <p className='monthly-special__subtitle' {...pa('subtitle')}>
          {content.subtitle}
        </p>
      </div>
      <div className='monthly-special__blog' {...pa('blog')}>
        {content.blog && <OptimizelyComponent content={content.blog} />}
      </div>
    </div>
  );
}
