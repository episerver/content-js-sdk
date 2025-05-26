import { Infer } from 'optimizely-cms-sdk/dist/infer';
import { BlankSectionContentType } from 'optimizely-cms-sdk/dist/model/internalContentTypes';
import {
  OptimizelySection,
  StructureWrapperProps,
} from 'optimizely-cms-sdk/dist/render/react';

function Row({ children }: StructureWrapperProps) {
  return <div>{children}</div>;
}

function Column({ children }: StructureWrapperProps) {
  return <div>{children}</div>;
}

type BlankSectionProps = {
  opti: Infer<typeof BlankSectionContentType>;
};

/** Defines a component to render a blank section */
export default function BlankSection({ opti }: BlankSectionProps) {
  return (
    <section>
      <OptimizelySection
        nodes={opti.nodes}
        wrappers={{
          row: Row,
          column: Column,
        }}
      />
    </section>
  );
}
