import { ReactNode } from 'react';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

type GridRowProps = {
  node: any;
  children?: ReactNode;
};

export default function GridRow({ node, children }: GridRowProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <div className='flex gap-4 my-2' {...pa(node)}>
      {children}
    </div>
  );
}
