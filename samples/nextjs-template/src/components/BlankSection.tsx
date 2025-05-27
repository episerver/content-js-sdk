import { Infer } from 'optimizely-cms-sdk/dist/infer';
import { BlankSectionContentType } from 'optimizely-cms-sdk/dist/model/internalContentTypes';
import {
  createOptimizelySection,
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

const SectionComponent = createOptimizelySection({ row: Row, column: Column });

/** Defines a component to render a blank section */
export default function BlankSection({ opti }: BlankSectionProps) {
  return (
    <section>
      <SectionComponent nodes={opti.nodes} />
    </section>
  );
}
