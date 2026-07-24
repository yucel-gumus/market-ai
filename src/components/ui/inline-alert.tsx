'use client';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'error' | 'warning' | 'info' | 'success';

// All alert variants styled strictly within the #FFEBD3, #FFB6A6, #9BCEC1 palette system
const styles: Record<AlertVariant, string> = {
  error:
    'border-[#F7A898] bg-[#FFECE8] text-[#4A1E17]',
  warning:
    'border-[#F7A898] bg-[#FFB6A6]/30 text-[#4A1E17]',
  info:
    'border-[#7BB6A8] bg-[#9BCEC1]/25 text-[#0E2C24]',
  success:
    'border-[#7BB6A8] bg-[#9BCEC1] text-[#0E2C24]',
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
        'flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xs',
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
          className="rounded-lg p-0.5 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
