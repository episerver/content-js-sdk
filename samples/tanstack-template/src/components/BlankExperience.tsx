import { BlankExperienceContentType, type ContentProps } from '@optimizely/cms-sdk';
import { OptimizelyComposition } from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof BlankExperienceContentType>;
};

export default function BlankExperience({ content }: Props) {
  return (
    <main className="blank-experience">
      <OptimizelyComposition nodes={content.composition.nodes ?? []} />
    </main>
  );
}
