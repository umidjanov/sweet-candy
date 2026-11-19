import React from 'react';
import { Cake } from 'lucide-react';
import { Button } from './button';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  actionHref,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-[#EEE6E9] shadow-soft my-6">
      <div className="w-16 h-16 rounded-2xl bg-[#FFF0F5] flex items-center justify-center text-[#E85D8E] mb-4">
        {icon || <Cake className="w-8 h-8" />}
      </div>
      <h3 className="text-xl font-bold text-[#29252A] mb-2">{title}</h3>
      <p className="text-sm text-[#817781] max-w-sm mb-6">{description}</p>
      {actionText && actionHref && (
        <Link href={actionHref}>
          <Button variant="primary">{actionText}</Button>
        </Link>
      )}
      {actionText && onAction && !actionHref && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

