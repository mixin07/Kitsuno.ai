import { useState } from 'react'

const INPUT_CLASS =
  'w-full rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-2.5 text-[var(--ks-text)] outline-none transition placeholder:text-[var(--ks-text-muted)] focus:border-[var(--ks-orange)] focus:ring-2 focus:ring-[var(--ks-orange)]/25 disabled:opacity-50 shadow-xs'
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-[var(--ks-text)]'

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
        <p
          role="alert"
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600"
        >
          {error}
        </p>
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

      <div className="flex flex-wrap justify-end gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-2 font-medium text-[var(--ks-text)] transition hover:bg-[var(--ks-bg-soft)] disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[var(--ks-orange)] px-5 py-2 font-semibold text-white transition hover:bg-[var(--ks-orange-light)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}