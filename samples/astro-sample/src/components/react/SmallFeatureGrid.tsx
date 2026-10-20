import type { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { SmallFeatureGridContentType } from '@/lib/contentTypes';

type Props = {
  content: ContentProps<typeof SmallFeatureGridContentType>;
};

export default function SmallFeatureGrid({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <div className='small-feature-grid' {...pa('smallFeatures')}>
      {content.smallFeatures?.map((feature, i) => (
        <OptimizelyComponent content={feature} key={i} />
      ))}
    </div>
  );
}
