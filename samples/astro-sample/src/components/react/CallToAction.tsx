import type { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { CallToActionContentType } from '@/lib/contentTypes';

type Props = {
  content: ContentProps<typeof CallToActionContentType>;
};

export default function CallToAction({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <a href={content.link ?? '#'} {...pa('label')}>
      {content.label}
    </a>
  );
}
