import type { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { LandingSectionContentType } from '@/lib/contentTypes';

type Props = {
  content: ContentProps<typeof LandingSectionContentType>;
};

export default function LandingSection({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <section>
      <header className='landing-header'>
        <h2 {...pa('heading')}>{content.heading}</h2>
        <p {...pa('subtitle')}>{content.subtitle}</p>
      </header>
      <div {...pa('sections')}>
        {(content.sections ?? []).map((section, i) => (
          <OptimizelyComponent content={section} key={i} />
        ))}
      </div>
    </section>
  );
}
