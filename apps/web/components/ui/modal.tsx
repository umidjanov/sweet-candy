'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end xs:items-center justify-center p-2 xs:p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-[#29252A]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-white rounded-2xl xs:rounded-3xl shadow-xl border border-[#EEE6E9] p-4 xs:p-5 sm:p-6 z-10 transform transition-all',
          className
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="min-w-0">
            {title && <h3 className="text-lg sm:text-xl font-bold text-[#29252A] leading-snug">{title}</h3>}
            {description && <p className="text-xs sm:text-sm text-[#817781] mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#817781] hover:text-[#29252A] hover:bg-[#FFF0F5] transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
