import { useState } from 'react'

const INPUT_CLASS =
  'w-full rounded-[6px] border-2 border-[#241A16] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#241A16] outline-none shadow-[2px_2px_0_#241A16] transition placeholder:text-neutral-400 focus:border-[#F16524] disabled:opacity-50'
const LABEL_CLASS = 'mb-1.5 block text-[11px] font-mono font-bold uppercase tracking-wider text-[#241A16]'

export default function LessonForm({
  initialValues,
  submitLabel = 'Save Lesson',
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    content: initialValues?.content ?? '',
    video_url: initialValues?.video_url ?? '',
    resource_url: initialValues?.resource_url ?? '',
    duration_minutes:
      initialValues?.duration_minutes != null ? String(initialValues.duration_minutes) : '',
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
    if (
      form.duration_minutes &&
      (!/^\d+$/.test(form.duration_minutes) || Number(form.duration_minutes) < 0)
    ) {
      errors.duration_minutes = 'Must be a non-negative whole number.'
    }
    if (form.order_number && (!/^\d+$/.test(form.order_number) || Number(form.order_number) < 1)) {
      errors.order_number = 'Must be a whole number of 1 or more.'
    }
    for (const urlField of ['video_url', 'resource_url']) {
      if (form[urlField].trim() && !/^https?:\/\/.+/.test(form[urlField].trim())) {
        errors[urlField] = 'Must be an http(s) URL.'
      }
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      content: form.content.trim() || null,
      video_url: form.video_url.trim() || null,
      resource_url: form.resource_url.trim() || null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
    }
    if (form.order_number) payload.order_number = Number(form.order_number)
    onSubmit(payload)
  }

  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#241A16] pb-3">
        <div>
          <span className="ks-eyebrow">Lesson Content</span>
          <h4 className="font-serif text-xl font-normal text-[#241A16] mt-0.5">
            {initialValues ? 'Edit Lesson' : 'New Lesson'}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-[#F16524] hover:underline"
            >
              ← Back to module
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className={`rounded-[6px] border-2 border-[#241A16] px-3 py-1.5 text-xs font-bold transition shadow-[2px_2px_0_#241A16] ${
              showPreview
                ? 'bg-white text-[#241A16]'
                : 'bg-[#FFF2E6] text-[#F16524]'
            }`}
          >
            {showPreview ? 'Back to Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="space-y-4 rounded-[8px] border-2 border-[#241A16] bg-[#FAF8F5] p-5 shadow-[2px_2px_0_#241A16]">
          <div>
            <span className="ks-eyebrow">Preview — Student View</span>
            <h3 className="font-serif text-2xl font-normal text-[#241A16] mt-1">
              {form.title.trim() || 'Untitled lesson'}
            </h3>
            {form.description.trim() ? (
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {form.description.trim()}
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-neutral-400">No description</p>
            )}
          </div>

          {form.video_url.trim() ? (
            <div className="rounded-[6px] border-2 border-[#241A16] bg-black p-2 text-center text-xs text-white">
              Video: {form.video_url.trim()}
            </div>
          ) : (
            <p className="rounded-[6px] border-2 border-[#241A16] bg-white px-4 py-3 text-sm text-neutral-600 shadow-[2px_2px_0_#241A16]">
              No video — student will see “This lesson has no video.”
            </p>
          )}

          {form.content.trim() ? (
            <div className="whitespace-pre-wrap rounded-[6px] border-2 border-[#241A16] bg-white p-5 text-sm leading-relaxed text-[#241A16] shadow-[2px_2px_0_#241A16]">
              {form.content.trim()}
            </div>
          ) : (
            <p className="rounded-[6px] border-2 border-dashed border-[#241A16] bg-white px-4 py-6 text-center text-sm text-neutral-500">
              No lesson content yet. Write content above to see preview.
            </p>
          )}

          {form.resource_url.trim() && (
            <a
              href={form.resource_url.trim()}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-bold text-[#F16524] hover:underline"
            >
              Open resource ↗
            </a>
          )}

          <div className="flex flex-wrap gap-2 border-t-2 border-[#241A16] pt-3 text-xs font-mono text-neutral-500">
            {form.duration_minutes && <span>{form.duration_minutes} min</span>}
            {form.order_number && <span>Order {form.order_number}</span>}
          </div>

          <p className="text-[11px] text-neutral-500">
            Preview uses the same plain-text content format rendered on the student lesson page.
          </p>
        </div>
      ) : null}

      {error && (
        <p
          role="alert"
          className="rounded-[6px] border-2 border-rose-400 bg-rose-50 px-4 py-3 text-xs text-rose-800 shadow-[2px_2px_0_#241A16]"
        >
          {error}
        </p>
      )}

      {!showPreview && (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lesson-title" className={LABEL_CLASS}>
            Title *
          </label>
          <input
            id="lesson-title"
            type="text"
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
            disabled={isSubmitting}
            className={INPUT_CLASS}
            placeholder="Lesson title"
          />
          {fieldErrors.title && (
            <p className="mt-1 text-sm text-rose-400">{fieldErrors.title}</p>
          )}
        </div>
        <div>
          <label htmlFor="lesson-order" className={LABEL_CLASS}>
            Order number
          </label>
          <input
            id="lesson-order"
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
      </div>

      <div>
        <label htmlFor="lesson-description" className={LABEL_CLASS}>
          Description
        </label>
        <textarea
          id="lesson-description"
          rows={2}
          value={form.description}
          onChange={(event) => setField('description', event.target.value)}
          disabled={isSubmitting}
          className={INPUT_CLASS}
          placeholder="Short summary of this lesson"
        />
      </div>

      <div>
        <label htmlFor="lesson-content" className={LABEL_CLASS}>
          Content
        </label>
        <textarea
          id="lesson-content"
          rows={12}
          value={form.content}
          onChange={(event) => setField('content', event.target.value)}
          disabled={isSubmitting}
          className={`${INPUT_CLASS} min-h-[220px] leading-relaxed`}
          placeholder="Write the full lesson content here. Supports plain text with line breaks as rendered on the student lesson page."
        />
        <p className="mt-1 text-xs text-[var(--ks-text-muted)]">
          Content is rendered as written on the student lesson page.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lesson-video" className={LABEL_CLASS}>
            Video URL
          </label>
          <input
            id="lesson-video"
            type="url"
            value={form.video_url}
            onChange={(event) => setField('video_url', event.target.value)}
            disabled={isSubmitting}
            className={INPUT_CLASS}
            placeholder="https://..."
          />
          {fieldErrors.video_url && (
            <p className="mt-1 text-sm text-rose-400">{fieldErrors.video_url}</p>
          )}
        </div>
        <div>
          <label htmlFor="lesson-resource" className={LABEL_CLASS}>
            Resource URL
          </label>
          <input
            id="lesson-resource"
            type="url"
            value={form.resource_url}
            onChange={(event) => setField('resource_url', event.target.value)}
            disabled={isSubmitting}
            className={INPUT_CLASS}
            placeholder="https://..."
          />
          {fieldErrors.resource_url && (
            <p className="mt-1 text-sm text-rose-400">{fieldErrors.resource_url}</p>
          )}
        </div>
      </div>

      <div className="sm:max-w-xs">
        <label htmlFor="lesson-duration" className={LABEL_CLASS}>
          Duration (minutes)
        </label>
        <input
          id="lesson-duration"
          type="text"
          inputMode="numeric"
          value={form.duration_minutes}
          onChange={(event) => setField('duration_minutes', event.target.value)}
          disabled={isSubmitting}
          className={INPUT_CLASS}
          placeholder="e.g. 15"
        />
        {fieldErrors.duration_minutes && (
          <p className="mt-1 text-sm text-rose-400">{fieldErrors.duration_minutes}</p>
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
      )}
    </div>
  )
}