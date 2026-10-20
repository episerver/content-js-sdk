import { BlankExperienceContentType, ContentProps } from '@optimizely/cms-sdk';
import { OptimizelyComposition } from '@optimizely/cms-sdk/react/server';
import FullWidthLayout from '../layouts/FullWidthLayout';

type BlankExperienceProps = {
  content: ContentProps<typeof BlankExperienceContentType>;
};

export default function BlankExperience({ content }: BlankExperienceProps) {
  return (
    <FullWidthLayout>
      <OptimizelyComposition nodes={content.composition.nodes ?? []} />
    </FullWidthLayout>
  );
}
