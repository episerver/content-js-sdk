import { ReactNode } from 'react';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { cn } from '../../lib/utils';

type GridProps = {
  node: any;
  children?: ReactNode;
};

export function GridRow({ node, children }: GridProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <div
      className={cn('mb-5 flex flex-col gap-4 last:mb-0 md:flex-row md:gap-6')}
      {...pa(node)}
    >
      {children}
    </div>
  );
}

export function GridColumn({ node, children }: GridProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <div className={cn('flex min-w-0 basis-0 grow flex-col gap-4')} {...pa(node)}>
      {children}
    </div>
  );
}
