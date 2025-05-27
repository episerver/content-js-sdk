import { Infer } from 'optimizely-cms-sdk/dist/infer';
import { BlankSectionContentType } from 'optimizely-cms-sdk/dist/model/internalContentTypes';
import {
  OptimizelyGridSection,
  StructureContainerProps,
} from 'optimizely-cms-sdk/dist/render/react';

function Row({ children }: StructureContainerProps) {
  return <div>{children}</div>;
}

function Column({ children }: StructureContainerProps) {
  return <div>{children}</div>;
}

type BlankSectionProps = {
  opti: Infer<typeof BlankSectionContentType>;
};

/** Defines a component to render a blank section */
export default function BlankSection({ opti }: BlankSectionProps) {
  return (
    <section>
      <OptimizelyGridSection nodes={opti.nodes} row={Row} column={Column} />
    </section>
  );
}
