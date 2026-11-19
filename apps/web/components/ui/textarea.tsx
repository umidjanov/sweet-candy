'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, rows = 3, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#29252A] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'w-full px-4 py-2.5 bg-white border border-[#EEE6E9] rounded-xl text-sm text-[#29252A] placeholder-[#817781]/60 transition-colors',
            'focus:outline-none focus:border-[#E85D8E] focus:ring-2 focus:ring-[#E85D8E]/20',
            error && 'border-[#DC5151] focus:border-[#DC5151] focus:ring-[#DC5151]/20',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-[#DC5151]">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#817781]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
