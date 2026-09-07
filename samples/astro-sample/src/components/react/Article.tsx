import type { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { ArticleContentType } from '@/lib/contentTypes';

type Props = {
  content: ContentProps<typeof ArticleContentType>;
};

export default function Article({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <main>
      <h1 {...pa('heading')}>{content.heading}</h1>
      <p {...pa('subtitle')}>{content.subtitle}</p>
      <div
        {...pa('body')}
        dangerouslySetInnerHTML={{ __html: content.body?.html ?? '' }}
      />
    </main>
  );
}
