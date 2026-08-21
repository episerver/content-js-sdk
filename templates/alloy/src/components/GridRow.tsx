import { ReactNode } from 'react';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

type GridRowProps = {
  node: any;
  children?: ReactNode;
};

export default function GridRow({ node, children }: GridRowProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <div className='mb-5 flex flex-col gap-4 last:mb-0 sm:flex-row sm:gap-5' {...pa(node)}>
      {children}
    </div>
  );
}
