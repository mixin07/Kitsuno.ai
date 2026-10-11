export default function ConfirmDialog({
  open,
  isOpen,
  title,
  message,
  confirmLabel,
  confirmText,
  error = '',
  isSubmitting = false,
  onConfirm,
  onCancel,
}) {
  const isVisible = open ?? isOpen ?? false
  if (!isVisible) return null

  const label = confirmLabel || confirmText || 'Delete'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#241A16]/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-[8px] border-2 border-[#241A16] bg-white p-6 shadow-[5px_5px_0_#241A16] text-[#241A16]">
        <h2 className="font-serif text-2xl font-normal text-[#241A16]">{title}</h2>
        <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">{message}</p>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md border-[1.5px] border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 font-mono"
          >
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="ks-neo-btn-secondary px-4 py-2 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="ks-neo-btn-primary px-4 py-2 text-xs font-bold !bg-rose-600 hover:!bg-rose-700"
          >
            {isSubmitting ? 'Processing...' : label}
          </button>
        </div>
      </div>
    </div>
  )
}