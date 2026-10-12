const STYLES = Object.freeze({
  info: 'border-2 border-[#241A16] bg-white text-[#241A16] shadow-[3px_3px_0_#241A16]',
  loading: 'border-2 border-[#241A16] bg-[#FAF8F5] text-[#241A16] shadow-[3px_3px_0_#241A16]',
  empty: 'border-2 border-[#241A16] bg-white text-[#241A16] shadow-[3px_3px_0_#241A16]',
  error: 'border-2 border-rose-400 bg-rose-50 text-rose-900 shadow-[3px_3px_0_#241A16]',
})

export default function StateMessage({ variant = 'info', title, children, onRetry }) {
  return (
    <div className={`rounded-[8px] px-6 py-10 text-center ${STYLES[variant]}`}>
      {variant === 'loading' && (
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#241A16]/20 border-t-[#F16524]" />
      )}
      {title && <h2 className="font-serif text-2xl font-normal text-[#241A16]">{title}</h2>}
      {children && <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-neutral-600 leading-relaxed">{children}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ks-neo-btn-primary mt-5 px-5 py-2 text-xs font-bold"
        >
          Retry
        </button>
      )}
    </div>
  )
}