import React from 'react';
import { cn } from '../../../lib/utils';

interface CtaProps {
  children?: React.ReactNode;
}

export const DecoGrid: React.FC<CtaProps> = ({ children }) => {
  return (
    <div className='relative'>
      <div className='container flex justify-between gap-6 absolute h-full left-0 right-0 pointer-events-none'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'grow border border-foreground/15 border-y-0 border-dashed md:block',
              { hidden: i < 4 },
            )}
          />
        ))}
      </div>
      {children}
    </div>
  );
};

export default DecoGrid;
