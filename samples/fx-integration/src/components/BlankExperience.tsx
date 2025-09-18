import { BlankExperienceContentType, Infer } from '@episerver/cms-sdk';
import {
  ComponentContainerProps,
  OptimizelyExperience,
  getPreviewUtils,
} from '@episerver/cms-sdk/react/server';
import css from './components.module.css';

type Props = {
  opti: Infer<typeof BlankExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <section className={css.BlankExperienceSection} {...pa(node)}>
      {children}
    </section>
  );
}

export default function BlankExperience({ opti }: Props) {
  return (
    <main className={css.BlankExperience}>
      <OptimizelyExperience
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
