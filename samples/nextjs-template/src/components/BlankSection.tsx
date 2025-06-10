import { Infer } from 'optimizely-cms-sdk/dist/infer';
import { BlankSectionContentType } from 'optimizely-cms-sdk/dist/model/internalContentTypes';
import {
  OptimizelyGridSection,
  StructureContainerProps,
  getPreviewUtils,
} from 'optimizely-cms-sdk/dist/render/react';

function Row({ children, node }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

function Column({ children, node }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

type BlankSectionProps = {
  opti: Infer<typeof BlankSectionContentType>;
};

/** Defines a component to render a blank section */
export default function BlankSection({ opti }: BlankSectionProps) {
  const { pa } = getPreviewUtils(opti);
  return (
    <section {...pa(opti)}>
      <OptimizelyGridSection nodes={opti.nodes} row={Row} column={Column} />
    </section>
  );
}
