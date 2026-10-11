import { useState } from 'react'

const INPUT_CLASS =
  'w-full rounded-[6px] border-2 border-[#241A16] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#241A16] outline-none shadow-[2px_2px_0_#241A16] transition placeholder:text-neutral-400 focus:border-[#F16524] disabled:opacity-50'
const LABEL_CLASS = 'mb-1.5 block text-[11px] font-mono font-bold uppercase tracking-wider text-[#241A16]'

export default function ModuleForm({
  initialValues,
  submitLabel = 'Save Module',
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    order_number: initialValues?.order_number != null ? String(initialValues.order_number) : '',
  })
  const [fieldErrors, setFieldErrors] = useState({})

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const errors = {}
    if (!form.title.trim()) errors.title = 'Title is required.'
    if (form.order_number && (!/^\d+$/.test(form.order_number) || Number(form.order_number) < 1)) {
      errors.order_number = 'Must be a whole number of 1 or more.'
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() ? form.description : null,
    }
    if (form.order_number) payload.order_number = Number(form.order_number)
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div
          role="alert"
          className="rounded-[6px] border-2 border-rose-400 bg-rose-50 px-4 py-2.5 text-xs text-rose-800 shadow-[2px_2px_0_#241A16]"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="module-title" className={LABEL_CLASS}>
          Title *
        </label>
        <input
          id="module-title"
          type="text"
          value={form.title}
          onChange={(event) => setField('title', event.target.value)}
          disabled={isSubmitting}
          className={INPUT_CLASS}
          placeholder="Module title"
        />
        {fieldErrors.title && <p className="mt-1 text-sm text-rose-400">{fieldErrors.title}</p>}
      </div>

      <div>
        <label htmlFor="module-description" className={LABEL_CLASS}>
          Description
        </label>
        <textarea
          id="module-description"
          rows={3}
          value={form.description}
          onChange={(event) => setField('description', event.target.value)}
          disabled={isSubmitting}
          className={INPUT_CLASS}
          placeholder="What does this module cover?"
        />
      </div>

      <div className="sm:max-w-xs">
        <label htmlFor="module-order" className={LABEL_CLASS}>
          Order number
        </label>
        <input
          id="module-order"
          type="text"
          inputMode="numeric"
          value={form.order_number}
          onChange={(event) => setField('order_number', event.target.value)}
          disabled={isSubmitting}
          className={INPUT_CLASS}
          placeholder="Leave blank to append"
        />
        {fieldErrors.order_number && (
          <p className="mt-1 text-sm text-rose-400">{fieldErrors.order_number}</p>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2.5 pt-2 border-t-[1.5px] border-[#241A16]/10">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="ks-neo-btn-secondary px-3.5 py-1.5 text-xs font-bold"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="ks-neo-btn-primary px-4 py-1.5 text-xs font-bold"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}