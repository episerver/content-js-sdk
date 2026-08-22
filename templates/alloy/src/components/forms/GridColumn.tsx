import { ReactNode } from 'react';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

type GridColumnProps = {
  node: any;
  children?: ReactNode;
};

export default function GridColumn({ node, children }: GridColumnProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <div className='flex min-w-0 flex-1 flex-col gap-4' {...pa(node)}>
      {children}
    </div>
  );
}
