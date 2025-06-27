import { contentType, Infer } from '@episerver/cms-sdk';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyExperience,
} from '@episerver/cms-sdk/react/server';

export const BlankExperienceContentType = contentType({
  key: 'BlankExperience',
  displayName: 'Blank Experience',
  baseType: '_experience',
});

type Props = {
  opti: Infer<typeof BlankExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function BlankExperience({ opti }: Props) {
  return (
    <OptimizelyExperience
      nodes={opti.composition.nodes ?? []}
      ComponentWrapper={ComponentWrapper}
    />
  );
}
