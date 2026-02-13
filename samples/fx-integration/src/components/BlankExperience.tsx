import { BlankExperienceContentType, Infer } from '@optimizely/cms-sdk';
import {
  ComponentContainerProps,
  OptimizelyExperience,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';
import css from './components.module.css';

type Props = {
  content: Infer<typeof BlankExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <section className={css.BlankExperienceSection} {...pa(node)}>
      {children}
    </section>
  );
}

export default function BlankExperience({ content }: Props) {
  return (
    <main className={css.BlankExperience}>
      <OptimizelyExperience
        nodes={content.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
