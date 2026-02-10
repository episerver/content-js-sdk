import { BlankSectionContentType, ContentProps } from '@optimizely/cms-sdk';
import {
  OptimizelyGridSection,
  StructureContainerProps,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';

type BlankSectionProps = {
  content: ContentProps<typeof BlankSectionContentType>;
};

function Row({ children }: StructureContainerProps) {
  return <div className="flex flex-wrap my-4">{children}</div>;
}

function Column({ children }: StructureContainerProps) {
  return <div className="flex-1 mx-2">{children}</div>;
}

/** Defines a component to render a blank section */
export default function BlankSection({ content }: BlankSectionProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <section {...pa(content)}>
      <OptimizelyGridSection nodes={content.nodes} row={Row} column={Column} />
    </section>
  );
}
