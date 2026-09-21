import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api.js'
import { getCourse } from '../../services/courseService.js'
import { listModules } from '../../services/moduleService.js'
import { listLessons } from '../../services/lessonService.js'
import {
  getCourseProgress,
  getLessonProgress,
  markLessonComplete,
  updateLessonProgress,
} from '../../services/progressService.js'
import ProgressBar from '../../components/learning/ProgressBar.jsx'
import StateMessage from '../../components/StateMessage.jsx'

export default function LessonLearningPage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [lessonList, setLessonList] = useState([])
  const [curIndex, setCurIndex] = useState(-1)
  const [currentLesson, setCurrentLesson] = useState(null)
  const [courseProgress, setCourseProgress] = useState(null)
  const [lessonProgress, setLessonProgress] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const videoRef = useRef(null)
  const watchAccumRef = useRef(0)
  const lastTimeRef = useRef(0)
  const lastSaveRef = useRef(0)

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const courseData = await getCourse(courseId)
        const modules = await listModules(courseId)
        const moduleSections = await Promise.all(
          modules.map(async (mod) => ({
            lessons: await listLessons(courseId, mod.id),
          })),
        )
        const flat = moduleSections.flatMap((section) => section.lessons)
        const index = flat.findIndex((lesson) => String(lesson.id) === String(lessonId))
        if (index === -1) {
          throw Object.assign(new Error('Lesson not found'), { response: { status: 404 } })
        }
        const [progressSummary, lessonState] = await Promise.all([
          getCourseProgress(courseId),
          getLessonProgress(lessonId),
        ])
        if (!active) return
        setCourse(courseData)
        setLessonList(flat)
        setCurIndex(index)
        setCurrentLesson(flat[index])
        setCourseProgress(progressSummary)
        setLessonProgress(lessonState)
        watchAccumRef.current = Number(lessonState.watch_time) || 0
        lastTimeRef.current = 0
        lastSaveRef.current = 0
      } catch (err) {
        if (!active) return
        setError(getApiErrorMessage(err))
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [courseId, lessonId])

  const persistWatch = useCallback(
    (position) => {
      const payload = {
        watch_time: Math.round(watchAccumRef.current * 100) / 100,
        last_position: Math.round((Number(position) || 0) * 100) / 100,
      }
      updateLessonProgress(lessonId, payload).catch(() => {
        // best-effort save; ignore transient failures
      })
    },
    [lessonId],
  )

  useEffect(() => {
    const video = videoRef.current
    const timer = window.setInterval(() => {
      const el = videoRef.current
      if (el) {
        persistWatch(el.currentTime)
      }
    }, 15000)

    const flushOnUnload = () => {
      const el = videoRef.current
      if (el) {
        persistWatch(el.currentTime)
      }
    }
    window.addEventListener('pagehide', flushOnUnload)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('pagehide', flushOnUnload)
      if (video) {
        persistWatch(video.currentTime)
      }
    }
  }, [persistWatch])

  async function refreshProgress() {
    const [progressSummary, lessonState] = await Promise.all([
      getCourseProgress(courseId),
      getLessonProgress(lessonId),
    ])
    setCourseProgress(progressSummary)
    setLessonProgress(lessonState)
  }

  async function handleToggleComplete() {
    setIsBusy(true)
    try {
      await markLessonComplete(lessonId, !lessonProgress?.completed)
      await refreshProgress()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  function handleTimeUpdate(event) {
    const time = event.currentTarget.currentTime
    if (lastTimeRef.current > 0 && time > lastTimeRef.current) {
      watchAccumRef.current += time - lastTimeRef.current
    }
    lastTimeRef.current = time

    const now = Date.now()
    if (now - lastSaveRef.current >= 10000) {
      lastSaveRef.current = now
      persistWatch(time)
    }
  }

  function handleVideoEnded() {
    const time = videoRef.current?.currentTime ?? 0
    persistWatch(time)
    if (!lessonProgress?.completed) {
      markLessonComplete(lessonId, true)
        .then(() => refreshProgress())
        .catch(() => {})
    }
  }

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading lesson..." />
  }

  if (error) {
    return (
      <StateMessage variant="error" title="Lesson not available">
        {error}
      </StateMessage>
    )
  }

  const prevLesson = curIndex > 0 ? lessonList[curIndex - 1] : null
  const nextLesson = curIndex < lessonList.length - 1 ? lessonList[curIndex + 1] : null
  const completed = Boolean(lessonProgress?.completed)

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <Link
          to={`/courses/${courseId}`}
          className="inline-block text-sm font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
        >
          ← Back to course
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-[var(--ks-text)]">{course.title}</h1>
          <span className="rounded-full border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1 text-xs font-semibold text-[var(--ks-text)] shadow-xs">
            {courseProgress.progress}% complete
          </span>
        </div>
        <ProgressBar value={courseProgress.progress} />
        <p className="text-xs text-[var(--ks-text-muted)]">
          Lesson {curIndex + 1} of {lessonList.length}
        </p>
      </div>

      <article className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{currentLesson.title}</h2>
          {currentLesson.description && (
            <p className="mt-2 leading-relaxed text-[var(--ks-text-muted)]">{currentLesson.description}</p>
          )}
        </div>

        {currentLesson.video_url ? (
          <video
            ref={videoRef}
            controls
            preload="auto"
            src={currentLesson.video_url}
            className="w-full rounded-xl border border-[var(--ks-border)] bg-black shadow-xs"
            onLoadedMetadata={(event) => {
              const position = Number(lessonProgress?.last_position) || 0
              if (position > 0) {
                event.currentTarget.currentTime = position
                lastTimeRef.current = position
              }
            }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
          />
        ) : (
          <p className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-3 text-sm text-[var(--ks-text-muted)]">
            This lesson has no video.
          </p>
        )}

        {currentLesson.content && (
          <div className="whitespace-pre-wrap rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 text-sm leading-relaxed text-[var(--ks-text)] shadow-xs">
            {currentLesson.content}
          </div>
        )}

        {currentLesson.resource_url && (
          <a
            href={currentLesson.resource_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block font-medium text-[var(--ks-orange)] hover:text-[var(--ks-deep)]"
          >
            Open resource ↗
          </a>
        )}

        {currentLesson.quiz_id && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--ks-orange)]/30 bg-[var(--ks-orange)]/5 p-5">
            <div>
              <h3 className="font-semibold text-[var(--ks-text)]">Lesson Quiz</h3>
              <p className="mt-1 text-sm text-[var(--ks-text-muted)]">
                Test your understanding of this lesson with a short quiz.
              </p>
            </div>
            <Link
              to={`/student/quiz/${currentLesson.quiz_id}?courseId=${courseId}&lessonId=${lessonId}`}
              className="rounded-lg bg-[var(--ks-orange)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--ks-orange-light)]"
            >
              Take Quiz →
            </Link>
          </div>
        )}
      </article>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ks-border)] pt-6">
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!prevLesson}
            onClick={() => prevLesson && navigate(`/courses/${courseId}/lessons/${prevLesson.id}`)}
            className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-2 text-sm font-medium text-[var(--ks-text)] transition hover:border-[var(--ks-orange)]/50 hover:bg-[var(--ks-bg-soft)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            type="button"
            disabled={!nextLesson}
            onClick={() => nextLesson && navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
            className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 py-2 text-sm font-medium text-[var(--ks-text)] transition hover:border-[var(--ks-orange)]/50 hover:bg-[var(--ks-bg-soft)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={isBusy}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            completed
              ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-600 font-semibold hover:bg-emerald-500/20'
              : 'bg-[var(--ks-orange)] text-white hover:bg-[var(--ks-orange-light)]'
          }`}
        >
          {completed ? 'Completed — Mark incomplete' : 'Mark as Complete'}
        </button>
      </div>
    </section>
  )
}