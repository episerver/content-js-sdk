import { BlankSectionContentType, Infer } from '@optimizely/cms-sdk';
import {
  OptimizelyGridSection,
  StructureContainerProps,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';
import css from './components.module.css';

type BlankSectionProps = {
  opti: Infer<typeof BlankSectionContentType>;
};

function Row({ children }: StructureContainerProps) {
  return <div className={css.BlankSectionRow}>{children}</div>;
}

function Column({ children }: StructureContainerProps) {
  return <div className={css.BlankSectionColumn}>{children}</div>;
}

/** Defines a component to render a blank section */
export default function BlankSection({ opti }: BlankSectionProps) {
  const { pa } = getPreviewUtils(opti);
  return (
    <section {...pa(opti)} className={css.BlankSection}>
      <OptimizelyGridSection nodes={opti.nodes} row={Row} column={Column} />
    </section>
  );
}
