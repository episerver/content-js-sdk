import { BlankSectionContentType, ContentProps } from '@optimizely/cms-sdk';
import {
  OptimizelyGridSection,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';

type BlankSectionProps = {
  content: ContentProps<typeof BlankSectionContentType>;
};

/** Defines a component to render a blank section */
export default function BlankSection({ content }: BlankSectionProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <section {...pa(content)}>
      <OptimizelyGridSection nodes={content.nodes} />
    </section>
  );
}
