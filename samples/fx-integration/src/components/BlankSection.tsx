import { BlankSectionContentType, Infer } from '@episerver/cms-sdk';
import {
  OptimizelyGridSection,
  getPreviewUtils,
} from '@episerver/cms-sdk/react/server';

type BlankSectionProps = {
  opti: Infer<typeof BlankSectionContentType>;
};

/** Defines a component to render a blank section */
export default function BlankSection({ opti }: BlankSectionProps) {
  const { pa } = getPreviewUtils(opti);
  return (
    <section {...pa(opti)}>
      <OptimizelyGridSection nodes={opti.nodes} />
    </section>
  );
}
