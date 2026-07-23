'use client';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'error' | 'warning' | 'info' | 'success';

const styles: Record<AlertVariant, string> = {
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100',
  success:
    'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100',
};

const icons: Record<AlertVariant, typeof AlertCircle> = {
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
  success: CheckCircle2,
};

interface InlineAlertProps {
  message: string;
  variant?: AlertVariant;
  onDismiss?: () => void;
  className?: string;
  role?: 'alert' | 'status';
}

export function InlineAlert({
  message,
  variant = 'error',
  onDismiss,
  className,
  role = 'alert',
}: InlineAlertProps) {
  if (!message) return null;
  const Icon = icons[variant];

  return (
    <div
      role={role}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
        styles[variant],
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p className="flex-1 leading-snug">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-0.5 opacity-70 hover:opacity-100"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
