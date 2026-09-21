const STYLES = Object.freeze({
  info: 'border-[var(--ks-border)] bg-[var(--ks-surface-soft)] text-[var(--ks-text-muted)]',
  loading: 'border-[var(--ks-orange)]/30 bg-[var(--ks-orange)]/5 text-[var(--ks-orange)]',
  empty: 'border-[var(--ks-border)] bg-[var(--ks-surface-soft)] text-[var(--ks-text-muted)]',
  error: 'border-[var(--ks-error-border)] bg-[var(--ks-error-bg)] text-[var(--ks-error)]',
})

export default function StateMessage({ variant = 'info', title, children, onRetry }) {
  return (
    <div className={`rounded-xl border px-6 py-10 text-center ${STYLES[variant]}`}>
      {variant === 'loading' && (
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--ks-border)] border-t-[var(--ks-orange)]" />
      )}
      {title && <h2 className="text-lg font-semibold text-[var(--ks-text)]">{title}</h2>}
      {children && <p className="mx-auto mt-2 max-w-lg text-sm">{children}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-lg bg-[var(--ks-orange)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--ks-orange-light)]"
        >
          Retry
        </button>
      )}
    </div>
  )
}