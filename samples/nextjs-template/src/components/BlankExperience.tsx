import { BlankExperienceContentType, ContentProps } from '@optimizely/cms-sdk';
import {
  ComponentContainerProps,
  OptimizelyExperience,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof BlankExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function BlankExperience({ content }: Props) {
  return (
    <main className="blank-experience">
      <OptimizelyExperience
        nodes={content.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
