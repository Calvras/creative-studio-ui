import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  tall = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string | undefined;
  subtitle?: string | undefined;
  children: ReactNode;
  footer?: ReactNode;
  tall?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className={`relative z-10 flex w-full flex-col rounded-t-3xl bg-surface shadow-2xl sheet-bottom ${
          tall ? "max-h-[88dvh]" : "max-h-[82dvh]"
        }`}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink/20" aria-hidden="true" />
        {(title || subtitle) && (
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-4">
            <div>
              {title && <h2 className="font-display text-base text-ink">{title}</h2>}
              {subtitle && <p className="mt-1 text-xs text-ink-dim">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink transition hover:bg-ink/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 [scrollbar-width:none]">
          {children}
        </div>
        {footer && <div className="shrink-0 border-t border-ink/5 px-5 pb-4 pt-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-label="Cancel"
      />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-surface p-5 shadow-2xl">
        <h2 className="font-display text-base text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-dim">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-surface-2 py-3 text-sm text-ink"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-full py-3 text-sm font-semibold ${
              destructive ? "bg-red-500 text-white" : "bg-brand text-sky-ink"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const timer = useRef<number | null>(null);
  useEffect(() => {
    timer.current = window.setTimeout(onDone, 2400);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [message, onDone]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-6">
      <div className="max-w-full rounded-full bg-surface-2/95 px-5 py-2.5 text-center text-xs text-ink shadow-xl ring-1 ring-white/10 backdrop-blur">
        {message}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-surface text-ink-dim">
        {icon}
      </span>
      <p className="mt-4 font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-[26ch] text-xs leading-relaxed text-ink-dim">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
