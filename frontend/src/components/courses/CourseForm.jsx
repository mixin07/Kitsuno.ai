import { useState } from 'react'
import { DIFFICULTIES, DIFFICULTY_LABELS } from '../../constants/courses.js'

const INPUT_CLASS =
  'w-full rounded-[6px] border-2 border-[#241A16] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#241A16] outline-none shadow-[2px_2px_0_#241A16] transition placeholder:text-neutral-400 focus:border-[#F16524] disabled:opacity-50'
const LABEL_CLASS = 'mb-1.5 block text-[11px] font-mono font-bold uppercase tracking-wider text-[#241A16]'

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
    if (
      form.thumbnail_url.trim() &&
      !/^https?:\/\/.+/.test(form.thumbnail_url.trim()) &&
      !form.thumbnail_url.trim().startsWith('/')
    ) {
      errors.thumbnail_url = 'Must be an http(s) URL or local path (e.g. /covers/...).'
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

      <div className="flex flex-wrap justify-end gap-2.5 pt-3 border-t-[1.5px] border-[#241A16]/10">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="ks-neo-btn-secondary px-4 py-2 text-xs font-bold"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="ks-neo-btn-primary px-5 py-2 text-xs font-bold"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}