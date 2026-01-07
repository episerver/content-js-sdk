import { BlankSectionContentType, Infer } from '@optimizely/cms-sdk';
import {
  OptimizelyGridSection,
  StructureContainerProps,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';
import css from './components.module.css';

type BlankSectionProps = {
  content: Infer<typeof BlankSectionContentType>;
};

function Row({ children }: StructureContainerProps) {
  return <div className={css.BlankSectionRow}>{children}</div>;
}

function Column({ children }: StructureContainerProps) {
  return <div className={css.BlankSectionColumn}>{children}</div>;
}

/** Defines a component to render a blank section */
export default function BlankSection({ content }: BlankSectionProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <section {...pa(content)} className={css.BlankSection}>
      <OptimizelyGridSection nodes={content.nodes} row={Row} column={Column} />
    </section>
  );
}
