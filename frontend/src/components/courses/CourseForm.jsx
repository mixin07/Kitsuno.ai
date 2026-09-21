import { useState } from 'react'
import { DIFFICULTIES, DIFFICULTY_LABELS } from '../../constants/courses.js'

const INPUT_CLASS =
  'w-full rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-2.5 text-[var(--ks-text)] outline-none transition placeholder:text-[var(--ks-text-muted)] focus:border-[var(--ks-orange)] focus:ring-2 focus:ring-[var(--ks-orange)]/25 disabled:opacity-50 shadow-xs'
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-[var(--ks-text)]'

export default function CourseForm({
  initialValues,
  submitLabel = 'Save Course',
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    thumbnail_url: initialValues?.thumbnail_url ?? '',
    category: initialValues?.category ?? '',
    difficulty: initialValues?.difficulty ?? DIFFICULTIES[0],
  })
  const [fieldErrors, setFieldErrors] = useState({})

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const errors = {}
    if (!form.title.trim()) errors.title = 'Title is required.'
    if (form.thumbnail_url.trim() && !/^https?:\/\/.+/.test(form.thumbnail_url.trim())) {
      errors.thumbnail_url = 'Must be an http(s) URL.'
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim() ? form.description : null,
      thumbnail_url: form.thumbnail_url.trim() ? form.thumbnail_url : null,
      category: form.category.trim() ? form.category : null,
      difficulty: form.difficulty,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600"
        >
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className={LABEL_CLASS}>
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(event) => setField('title', event.target.value)}
          disabled={isSubmitting}
          className={INPUT_CLASS}
          placeholder="Course title"
        />
        {fieldErrors.title && <p className="mt-1 text-sm text-rose-400">{fieldErrors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className={LABEL_CLASS}>
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={(event) => setField('description', event.target.value)}
          disabled={isSubmitting}
          className={INPUT_CLASS}
          placeholder="What will students learn?"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className={LABEL_CLASS}>
            Category
          </label>
          <input
            id="category"
            type="text"
            value={form.category}
            onChange={(event) => setField('category', event.target.value)}
            disabled={isSubmitting}
            className={INPUT_CLASS}
            placeholder="e.g. Programming"
          />
        </div>
        <div>
          <label htmlFor="difficulty" className={LABEL_CLASS}>
            Difficulty
          </label>
          <select
            id="difficulty"
            value={form.difficulty}
            onChange={(event) => setField('difficulty', event.target.value)}
            disabled={isSubmitting}
            className={INPUT_CLASS}
          >
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {DIFFICULTY_LABELS[difficulty]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="thumbnail_url" className={LABEL_CLASS}>
          Thumbnail URL
        </label>
        <input
          id="thumbnail_url"
          type="url"
          value={form.thumbnail_url}
          onChange={(event) => setField('thumbnail_url', event.target.value)}
          disabled={isSubmitting}
          className={INPUT_CLASS}
          placeholder="https://..."
        />
        {fieldErrors.thumbnail_url && (
          <p className="mt-1 text-sm text-rose-400">{fieldErrors.thumbnail_url}</p>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-5 py-2.5 font-medium text-[var(--ks-text)] transition hover:bg-[var(--ks-bg-soft)] disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[var(--ks-orange)] px-6 py-2.5 font-semibold text-white transition hover:bg-[var(--ks-orange-light)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}