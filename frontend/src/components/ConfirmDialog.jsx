export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  error = '',
  isSubmitting = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-[var(--ks-text)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--ks-text-muted)]">{message}</p>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600"
          >
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-2 font-medium text-[var(--ks-text)] transition hover:bg-[var(--ks-bg-soft)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}