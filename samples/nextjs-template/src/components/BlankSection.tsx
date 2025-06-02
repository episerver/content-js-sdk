import { Infer } from 'optimizely-cms-sdk/dist/infer';
import { BlankSectionContentType } from 'optimizely-cms-sdk/dist/model/internalContentTypes';
import {
  OptimizelyGridSection,
  StructureContainerProps,
  getPreviewAttrs as pa,
} from 'optimizely-cms-sdk/dist/render/react';

function Row({ children, node }: StructureContainerProps) {
  return <div {...pa(node)}>{children}</div>;
}

function Column({ children, node }: StructureContainerProps) {
  return <div {...pa(node)}>{children}</div>;
}

type BlankSectionProps = {
  opti: Infer<typeof BlankSectionContentType>;
};

/** Defines a component to render a blank section */
export default function BlankSection({ opti }: BlankSectionProps) {
  return (
    <section>
      <OptimizelyGridSection
        {...pa(opti)}
        nodes={opti.nodes}
        row={Row}
        column={Column}
      />
    </section>
  );
}
