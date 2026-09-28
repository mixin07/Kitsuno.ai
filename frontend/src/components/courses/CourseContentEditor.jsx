import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api.js'
import { getCourse, publishCourse, unpublishCourse } from '../../services/courseService.js'
import { createModule, deleteModule, listModules, updateModule } from '../../services/moduleService.js'
import {
  createLesson,
  deleteLesson,
  listLessons,
  updateLesson,
} from '../../services/lessonService.js'
import ConfirmDialog from '../ConfirmDialog.jsx'
import StateMessage from '../StateMessage.jsx'
import LessonForm from './LessonForm.jsx'
import ModuleForm from './ModuleForm.jsx'
import ModuleSection from './ModuleSection.jsx'

export default function CourseContentEditor({ courseId }) {
  const [course, setCourse] = useState(null)
  const [tree, setTree] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)

  const [moduleForm, setModuleForm] = useState(null)
  const [lessonForm, setLessonForm] = useState(null)
  const [formBusy, setFormBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      setLoadError('')

      try {
        const data = await getCourse(courseId)
        const modules = await listModules(courseId)

        const withLessons = await Promise.all(
          modules.map(async (mod) => ({
            module: mod,
            lessons: await listLessons(courseId, mod.id),
          })),
        )

        if (!active) return

        setCourse(data)
        setTree(withLessons)
      } catch (err) {
        if (!active) return
        setLoadError(getApiErrorMessage(err))
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [courseId])

  async function refreshTree() {
    const modules = await listModules(courseId)

    const withLessons = await Promise.all(
      modules.map(async (mod) => ({
        module: mod,
        lessons: await listLessons(courseId, mod.id),
      })),
    )

    setTree(withLessons)
  }

  async function handleCreateModule(values) {
    setFormBusy(true)
    setFormError('')

    try {
      await createModule(courseId, values)
      setModuleForm(null)
      await refreshTree()
      setNotice('Module added.')
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setFormBusy(false)
    }
  }

  async function handleUpdateModule(values) {
    setFormBusy(true)
    setFormError('')

    try {
      const updated = await updateModule(
        courseId,
        moduleForm.module.id,
        values,
      )

      setModuleForm(null)
      await refreshTree()
      setNotice(`Module "${updated.title}" updated.`)
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setFormBusy(false)
    }
  }

  async function handleCreateLesson(values) {
    setFormBusy(true)
    setFormError('')

    try {
      await createLesson(
        courseId,
        lessonForm.module.id,
        values,
      )

      setLessonForm(null)
      await refreshTree()
      setNotice('Lesson added.')
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setFormBusy(false)
    }
  }

  async function handleUpdateLesson(values) {
    setFormBusy(true)
    setFormError('')

    try {
      const updated = await updateLesson(
        courseId,
        lessonForm.module.id,
        lessonForm.lesson.id,
        values,
      )

      setLessonForm(null)
      await refreshTree()
      setNotice(`Lesson "${updated.title}" updated.`)
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setFormBusy(false)
    }
  }

  async function handleConfirmDelete() {
    if (!confirm) return

    setDeleting(true)
    setDeleteError('')

    try {
      if (confirm.kind === 'module') {
        await deleteModule(courseId, confirm.module.id)
        setNotice('Module deleted.')
      } else {
        await deleteLesson(
          courseId,
          confirm.module.id,
          confirm.lesson.id,
        )
        setNotice('Lesson deleted.')
      }

      setConfirm(null)
      await refreshTree()
    } catch (err) {
      setDeleteError(getApiErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  async function handleTogglePublish() {
    if (!course) return

    setIsPublishing(true)
    setNotice('')

    try {
      const updated = course.published
        ? await unpublishCourse(course.id)
        : await publishCourse(course.id)

      setCourse(updated)

      setNotice(
        updated.published
          ? 'Course published.'
          : 'Course unpublished.',
      )
    } catch (err) {
      if (err.response?.status === 409) {
        setNotice(
          'Add at least one module before publishing this course.',
        )
      } else {
        setNotice(getApiErrorMessage(err))
      }
    } finally {
      setIsPublishing(false)
    }
  }

  if (isLoading) {
    return (
      <StateMessage
        variant="loading"
        title="Loading course content..."
      />
    )
  }

  if (loadError) {
    return (
      <StateMessage
        variant="error"
        title="Unable to load course"
        onRetry={() => window.location.reload()}
      >
        {loadError}
      </StateMessage>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/instructor/courses"
            className="inline-block text-sm font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
          >
            ← Back to my courses
          </Link>

          <h1 className="ks-page-title mt-2">
            {course.title}
          </h1>

          <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
            {course.category && (
              <span className="rounded-full border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] px-3 py-1 text-[var(--ks-text-muted)]">
                {course.category}
              </span>
            )}

            <span
              className={`rounded-full px-3 py-1 ${
                course.published
                  ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 font-semibold'
                  : 'border border-amber-500/40 bg-amber-500/10 text-amber-700 font-semibold'
              }`}
            >
              {course.published ? 'Published' : 'Unpublished'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTogglePublish}
          disabled={isPublishing}
          className="rounded-lg bg-[var(--ks-orange)] px-5 py-2.5 font-semibold text-white transition hover:bg-[var(--ks-orange-light)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPublishing
            ? 'Saving...'
            : course.published
              ? 'Unpublish Course'
              : 'Publish Course'}
        </button>
      </div>

      {notice && (
        <p className="rounded-lg border border-[var(--ks-orange)]/30 bg-[var(--ks-orange)]/10 px-4 py-3 text-sm text-[var(--ks-orange)]">
          {notice}
        </p>
      )}

      <div className="space-y-4">
        {tree.map(({ module, lessons }) => (
          <ModuleSection
            key={module.id}
            module={module}
            lessons={lessons}
            onEditModule={() => {
              setFormError('')
              setModuleForm({
                mode: 'edit',
                module,
              })
            }}
            onDeleteModule={() =>
              setConfirm({
                kind: 'module',
                module,
              })
            }
            onAddLesson={() => {
              setFormError('')
              setLessonForm({
                mode: 'create',
                module,
              })
            }}
            onEditLesson={(lesson) => {
              setFormError('')
              setLessonForm({
                mode: 'edit',
                module,
                lesson,
              })
            }}
            onDeleteLesson={(lesson) =>
              setConfirm({
                kind: 'lesson',
                module,
                lesson,
              })
            }
          >
            {moduleForm?.mode === 'edit' &&
              moduleForm.module.id === module.id && (
                <div className="border-b border-[var(--ks-border)] px-5 py-5">
                  <ModuleForm
                    key={`module-${moduleForm.module.id}`}
                    initialValues={moduleForm.module}
                    submitLabel="Save Module"
                    isSubmitting={formBusy}
                    error={formError}
                    onSubmit={handleUpdateModule}
                    onCancel={() => setModuleForm(null)}
                  />
                </div>
              )}

            {lessonForm?.module.id === module.id && (
              <div className="border-b border-[var(--ks-border)] px-5 py-5">
                <LessonForm
                  key={
                    lessonForm.mode === 'edit'
                      ? `lesson-${lessonForm.lesson.id}`
                      : `create-lesson-${module.id}`
                  }
                  initialValues={
                    lessonForm.mode === 'edit'
                      ? lessonForm.lesson
                      : undefined
                  }
                  submitLabel={
                    lessonForm.mode === 'edit'
                      ? 'Save Lesson'
                      : 'Add Lesson'
                  }
                  isSubmitting={formBusy}
                  error={formError}
                  onSubmit={
                    lessonForm.mode === 'edit'
                      ? handleUpdateLesson
                      : handleCreateLesson
                  }
                  onCancel={() => setLessonForm(null)}
                />
              </div>
            )}
          </ModuleSection>
        ))}
      </div>

      {tree.length === 0 && (
        <StateMessage
          variant="empty"
          title="No modules yet"
        >
          Add the first module to start building this course. A course
          needs at least one module before it can be published.
        </StateMessage>
      )}

      {moduleForm?.mode === 'create' ? (
        <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs">
          <h3 className="ks-panel-title mb-4">
            New Module
          </h3>

          <ModuleForm
            submitLabel="Add Module"
            isSubmitting={formBusy}
            error={formError}
            onSubmit={handleCreateModule}
            onCancel={() => setModuleForm(null)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setFormError('')
            setModuleForm({
              mode: 'create',
            })
          }}
          className="w-full rounded-xl border border-dashed border-[var(--ks-border)] px-5 py-4 font-semibold text-[var(--ks-text-muted)] transition hover:border-[var(--ks-orange)]/60 hover:text-[var(--ks-orange)]"
        >
          + Add Module
        </button>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.kind === 'module'
            ? 'Delete module?'
            : 'Delete lesson?'
        }
        message={
          confirm?.kind === 'module'
            ? `Delete module "${confirm?.module?.title ?? ''}"? All lessons inside it will also be deleted. This cannot be undone.`
            : confirm?.kind === 'lesson'
              ? `Delete lesson "${confirm?.lesson?.title ?? ''}"? This cannot be undone.`
              : ''
        }
        error={deleteError}
        isSubmitting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </section>
  )
}