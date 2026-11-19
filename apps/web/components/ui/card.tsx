import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('bg-white border border-[#EEE6E9] rounded-2xl shadow-soft p-6 transition-all', className)}
      {...props}
    >
      {children}
    </div>
  );
};
