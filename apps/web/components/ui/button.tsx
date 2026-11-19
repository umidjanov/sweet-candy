'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'caramel';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variants = {
      primary:
        'bg-[#E85D8E] text-white hover:bg-[#C83F72] focus:ring-[#E85D8E] shadow-sm hover:shadow-md',
      secondary:
        'bg-[#FFF0F5] text-[#C83F72] hover:bg-[#ffe2ed] focus:ring-[#E85D8E]',
      outline:
        'border border-[#EEE6E9] bg-white text-[#29252A] hover:bg-[#FAF8F6] hover:border-[#E85D8E] focus:ring-[#E85D8E]',
      ghost:
        'text-[#817781] hover:text-[#29252A] hover:bg-[#FFF0F5] focus:ring-[#E85D8E]',
      danger:
        'bg-[#DC5151] text-white hover:bg-red-600 focus:ring-red-500',
      caramel:
        'bg-[#D99A52] text-white hover:bg-[#c2833d] focus:ring-[#D99A52]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
