'use client';

export function AdminErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <span className="min-w-0 flex-1">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function AdminLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p className="mt-8 text-sm text-ink-500" role="status" aria-live="polite">
      {label}
    </p>
  );
}
