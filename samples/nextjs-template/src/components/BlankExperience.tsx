import Image from 'next/image';
import { BlankExperienceContentType, Infer } from '@episerver/cms-sdk';
import {
  ComponentContainerProps,
  OptimizelyExperience,
  getPreviewUtils,
} from '@episerver/cms-sdk/react/server';

type Props = {
  opti: Infer<typeof BlankExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function BlankExperience({ opti }: Props) {
  return (
    <main className="blank-experience">
      <OptimizelyExperience
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
