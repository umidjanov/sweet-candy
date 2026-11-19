'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  tagline?: string;
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  tagline,
  showText = true,
  className,
}) => {
  const imgSizes = {
    sm: 'w-9 h-9 xs:w-10 xs:h-10',
    md: 'w-10 h-10 xs:w-11 xs:h-11 lg:w-12 lg:h-12',
    lg: 'w-20 h-20 sm:w-24 sm:h-24',
  };

  const textSizes = {
    sm: 'text-base xs:text-lg',
    md: 'text-base xs:text-xl lg:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  return (
    <div className={cn('inline-flex items-center gap-2 xs:gap-2.5 min-w-0', className)}>
      <div
        className={cn(
          'rounded-2xl bg-[#FFF6F8] border border-[#F5D6DF] overflow-hidden flex items-center justify-center shadow-sm flex-shrink-0 p-0.5',
          imgSizes[size]
        )}
      >
        <img
          src="/logo-sweet-candy.jpg"
          alt="Sweet CANDY Logo"
          className="w-full h-full object-contain rounded-xl mix-blend-multiply"
        />
      </div>

      {showText && (
        <div className="min-w-0 leading-none">
          <span
            className={cn(
              'font-candy font-black tracking-tight flex items-baseline gap-1 whitespace-nowrap',
              textSizes[size]
            )}
          >
            <span className="candy-word-sweet">Sweet</span>
            <span className="candy-word-candy uppercase tracking-wide">CANDY</span>
          </span>
          {tagline && (
            <span className="hidden sm:block text-[10px] tracking-wider uppercase font-semibold text-[#85777D] mt-0.5 truncate">
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

