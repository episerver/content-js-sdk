import { BlankExperienceContentType, ContentProps } from '@optimizely/cms-sdk';
import {
  ComponentContainerProps,
  OptimizelyComposition,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';
import css from './components.module.css';

type Props = {
  content: ContentProps<typeof BlankExperienceContentType>;
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
      <OptimizelyComposition
        nodes={content.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
