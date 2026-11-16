'use client';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'error' | 'warning' | 'info' | 'success';

// All alert variants styled strictly within the İpek Küllü Arduvaz 10-hex palette system
const styles: Record<AlertVariant, string> = {
  error:
    'border-[#AB421C] bg-[#F2A488]/30 text-[#253341] [&>svg]:text-[#AB421C]',
  warning:
    'border-[#EC7D55] bg-[#F2A488]/40 text-[#253341] [&>svg]:text-[#AB421C]',
  info:
    'border-[#BCC7D2] bg-[#DBE6DD] text-[#253341] [&>svg]:text-[#3E5164]',
  success:
    'border-[#3E5164] bg-[#DBE6DD] text-[#253341] [&>svg]:text-[#253341]',
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
