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
import { getSavedOverview, saveLesson, unsaveLesson } from '../../services/savedService.js'
import { Sparkles, FileText, Bot, Bookmark, BookmarkCheck, CheckCircle2 } from 'lucide-react'
import ProgressBar from '../../components/learning/ProgressBar.jsx'
import StateMessage from '../../components/StateMessage.jsx'
import AIStudyAssistantPanel from '../../components/learning/AIStudyAssistantPanel.jsx'
import AILessonSummary from '../../components/ai/AILessonSummary.jsx'
import AIStudyNotes from '../../components/ai/AIStudyNotes.jsx'

function getYouTubeEmbedUrl(url) {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11
    ? `https://www.youtube-nocookie.com/embed/${match[2]}`
    : null
}

export default function LessonLearningPage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [modulesTree, setModulesTree] = useState([])
  const [lessonList, setLessonList] = useState([])
  const [curIndex, setCurIndex] = useState(-1)
  const [currentLesson, setCurrentLesson] = useState(null)
  const [currentModule, setCurrentModule] = useState(null)
  const [courseProgress, setCourseProgress] = useState(null)
  const [lessonProgress, setLessonProgress] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [isLessonSaved, setIsLessonSaved] = useState(false)
  const [isSavingLesson, setIsSavingLesson] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeAiTab, setActiveAiTab] = useState('summary')

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
        const withLessons = await Promise.all(
          modules.map(async (mod) => ({
            module: mod,
            lessons: await listLessons(courseId, mod.id),
          })),
        )

        const flatLessons = []
        let foundModule = null

        withLessons.forEach((section) => {
          section.lessons.forEach((l) => {
            flatLessons.push(l)
            if (String(l.id) === String(lessonId)) {
              foundModule = section.module
            }
          })
        })

        const index = flatLessons.findIndex((lesson) => String(lesson.id) === String(lessonId))
        if (index === -1) {
          throw Object.assign(new Error('Lesson not found'), { response: { status: 404 } })
        }

        const [progressSummary, lessonState, savedOverview] = await Promise.all([
          getCourseProgress(courseId),
          getLessonProgress(lessonId),
          getSavedOverview().catch(() => ({ saved_lesson_ids: [] })),
        ])

        if (!active) return
        setCourse(courseData)
        setModulesTree(withLessons)
        setLessonList(flatLessons)
        setCurIndex(index)
        setCurrentLesson(flatLessons[index])
        setCurrentModule(foundModule)
        setCourseProgress(progressSummary)
        setLessonProgress(lessonState)
        setIsLessonSaved(Boolean(savedOverview?.saved_lesson_ids?.includes(Number(lessonId))))
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
      updateLessonProgress(lessonId, payload).catch(() => {})
    },
    [lessonId],
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      const el = videoRef.current
      if (el && !el.paused) {
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
    window.addEventListener('beforeunload', flushOnUnload)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('pagehide', flushOnUnload)
      window.removeEventListener('beforeunload', flushOnUnload)
      // Intentionally read current ref at cleanup to persist final watch position;
      // value at unmount is needed, not the value at effect creation.
      // oxlint-disable-next-line react-hooks/exhaustive-deps
      const el = videoRef.current
      if (el) {
        persistWatch(el.currentTime)
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
      const nextCompletedState = !lessonProgress?.completed
      await markLessonComplete(lessonId, nextCompletedState)
      await refreshProgress()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleToggleSaveLesson() {
    if (isSavingLesson) return
    setIsSavingLesson(true)
    try {
      if (isLessonSaved) {
        await unsaveLesson(lessonId)
        setIsLessonSaved(false)
      } else {
        await saveLesson(lessonId)
        setIsLessonSaved(true)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSavingLesson(false)
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
  const completedIds = new Set(courseProgress?.completed_lesson_ids || [])

  const ytEmbedUrl = getYouTubeEmbedUrl(currentLesson.video_url)

  return (
    <div className="flex flex-col gap-6 lg:flex-row pb-8">
      {/* LEFT COLUMN: COURSE CONTENT SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } w-full lg:block lg:w-80 shrink-0 space-y-4`}
      >
        <div className="sticky top-20 rounded-[8px] border-[1.5px] border-[#241A16] bg-white p-4 shadow-[2.5px_2.5px_0_#241A16]">
          {/* Header & Course Progress */}
          <div className="border-b border-[rgba(36,26,22,0.12)] pb-4">
            <div className="flex items-center justify-between">
              <span className="ks-eyebrow text-[10px]">
                Course Content
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-xs font-mono font-bold text-neutral-500 hover:text-[#241A16]"
              >
                Hide
              </button>
            </div>
            <h2 className="mt-1 ks-card-title text-base sm:text-lg text-[#241A16] line-clamp-1">
              {course.title}
            </h2>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono font-semibold">
                <span className="text-neutral-500">
                  {courseProgress?.completed_lessons || 0} / {courseProgress?.total_lessons || lessonList.length} completed
                </span>
                <span className="text-[#F16524] font-bold">
                  {courseProgress?.progress || 0}%
                </span>
              </div>
              <ProgressBar value={courseProgress?.progress || 0} />
            </div>
          </div>

          {/* Module & Lesson Navigation Tree */}
          <div className="mt-4 max-h-[calc(100vh-280px)] overflow-y-auto space-y-4 pr-1">
            {modulesTree.map(({ module, lessons }) => {
              const moduleCompletedCount = lessons.filter((l) => completedIds.has(l.id)).length

              return (
                <div key={module.id} className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 text-xs font-mono font-bold text-[#241A16] uppercase tracking-wider">
                    <span className="truncate">
                      {module.order_number}. {module.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-neutral-500 shrink-0 ml-1">
                      {moduleCompletedCount}/{lessons.length}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {lessons.map((lesson) => {
                      const isCurrent = String(lesson.id) === String(lessonId)
                      const isDone = completedIds.has(lesson.id)

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)}
                          className={`flex w-full items-center justify-between gap-2 rounded px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-[#F16524]/10 text-[#F16524] font-bold border-[1.5px] border-[#241A16] shadow-[1px_1px_0_#241A16]'
                              : 'text-neutral-700 hover:bg-[#FAF8F5] border border-transparent hover:border-[rgba(36,26,22,0.18)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                                isDone
                                  ? 'bg-emerald-600 text-white'
                                  : isCurrent
                                  ? 'bg-[#F16524] text-white'
                                  : 'border border-[rgba(36,26,22,0.25)] text-transparent'
                              }`}
                            >
                              {isDone ? '✓' : '•'}
                            </span>
                            <span className="truncate">
                              {lesson.order_number}. {lesson.title}
                            </span>
                          </div>
                          {lesson.duration_minutes != null && (
                            <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                              {lesson.duration_minutes}m
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </aside>

      {/* RIGHT COLUMN: MAIN LESSON WORKSPACE */}
      <main className="flex-1 space-y-6 min-w-0">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-[1.5px] border-[#241A16]">
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#F16524] hover:text-[#241A16] transition-colors"
          >
            ← Back to course
          </Link>

          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-xs font-mono font-bold uppercase tracking-wider text-[#F16524] border-[1.5px] border-[#241A16] bg-[#F16524]/10 px-3 py-1 rounded-[6px]"
            >
              Show Curriculum Sidebar
            </button>
          )}
        </div>

        {/* Lesson Metadata */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="ks-eyebrow">
              {currentModule ? `MODULE ${currentModule.order_number}: ${currentModule.title.toUpperCase()}` : 'LESSON'}
            </span>
            <span className="w-1.5 h-1.5 bg-[#F16524]" />
            <span className="text-xs font-mono text-neutral-500">Lesson {curIndex + 1} of {lessonList.length}</span>
            {currentLesson.duration_minutes != null && (
              <span className="rounded-[4px] border border-[#241A16] bg-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#241A16]">
                ⏱ {currentLesson.duration_minutes} min
              </span>
            )}
          </div>
          <h1 className="ks-page-title mt-1.5">{currentLesson.title}</h1>
          {currentLesson.description && (
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-neutral-700">
              {currentLesson.description}
            </p>
          )}

          {/* Action / State Toolbar */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleComplete}
              disabled={isBusy}
              className={`inline-flex items-center gap-1.5 rounded-[6px] border-[1.5px] border-[#241A16] px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition shadow-[1.5px_1.5px_0_#241A16] cursor-pointer ${
                completed
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'ks-neo-btn-primary'
              }`}
            >
              {completed ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                  <span>✓ Completed</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span>Start Lesson →</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleSaveLesson}
              disabled={isSavingLesson}
              className={`inline-flex items-center gap-1.5 rounded-[6px] border-[1.5px] border-[#241A16] px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition shadow-[1.5px_1.5px_0_#241A16] cursor-pointer ${
                isLessonSaved
                  ? 'bg-[#FFF2E6] text-[#F16524]'
                  : 'bg-white text-[#241A16] hover:bg-[#FAF8F5]'
              }`}
            >
              {isLessonSaved ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5 text-[#F16524]" />
                  <span>✓ Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>♡ Save Lesson</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Video Player Section */}
        {ytEmbedUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-[8px] border-[1.5px] border-[#241A16] bg-black shadow-[2.5px_2.5px_0_#241A16]">
            <iframe
              src={ytEmbedUrl}
              title={currentLesson.title}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : currentLesson.video_url ? (
          <video
            ref={videoRef}
            controls
            preload="auto"
            src={currentLesson.video_url}
            className="w-full rounded-[8px] border-[1.5px] border-[#241A16] bg-black shadow-[2.5px_2.5px_0_#241A16]"
            onLoadedMetadata={(event) => {
              const position = Number(lessonProgress?.last_position) || 0
              if (position > 0) {
                try {
                  const duration = event.currentTarget.duration
                  const clamped = Number.isFinite(duration) && position >= duration ? Math.max(0, duration - 1) : position
                  event.currentTarget.currentTime = clamped
                  lastTimeRef.current = clamped
                } catch {}
              }
            }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
          />
        ) : (
          <div className="rounded-[8px] border-[1.5px] border-[#241A16] bg-white p-6 text-center text-xs font-mono text-neutral-500 shadow-[2px_2px_0_#241A16]">
            No video playback available for this lesson.
          </div>
        )}

        {/* Documentation / External Resource Card */}
        {currentLesson.resource_url && (
          <div className="ks-neo-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] border-[#241A16] bg-[#F16524]/10 text-base shadow-[1px_1px_0_#241A16]">
                📄
              </span>
              <div>
                <h4 className="ks-card-title text-base text-[#241A16]">
                  Lesson Documentation & Reference
                </h4>
                <p className="text-xs text-neutral-600">
                  Official MDN Web Docs / Technical Reference Guide
                </p>
              </div>
            </div>
            <a
              href={currentLesson.resource_url}
              target="_blank"
              rel="noreferrer"
              className="ks-neo-btn-secondary px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              <span>Open Resource</span>
              <span>↗</span>
            </a>
          </div>
        )}

        {/* Lesson Text Content */}
        {currentLesson.content && (
          <div className="ks-neo-card p-5 whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-neutral-800">
            {currentLesson.content}
          </div>
        )}

        {/* Lesson Quiz Banner */}
        {currentLesson.quiz_id && (
          <div className="ks-neo-card p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="ks-card-title text-lg sm:text-xl text-[#241A16]">Lesson Quiz</h3>
              <p className="mt-1 text-xs sm:text-sm text-neutral-600">
                Test your understanding of this lesson with a quick quiz.
              </p>
            </div>
            <Link
              to={`/student/quiz/${currentLesson.quiz_id}?courseId=${courseId}&lessonId=${lessonId}`}
              className="ks-neo-btn-primary px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider"
            >
              Take Quiz →
            </Link>
          </div>
        )}

        {/* AI STUDY TOOLS TABBED SUITE */}
        <div className="space-y-4 pt-2 border-t border-[rgba(36,26,22,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="ks-eyebrow">
                AI STUDY TOOLS
              </span>
              <span className="w-1.5 h-1.5 bg-[#F16524]" />
            </div>

            <div className="flex items-center gap-1 rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-1 shadow-[1.5px_1.5px_0_#241A16]">
              <button
                type="button"
                onClick={() => setActiveAiTab('summary')}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                  activeAiTab === 'summary'
                    ? 'bg-white text-[#241A16] border-[1.5px] border-[#241A16] shadow-[1px_1px_0_#241A16]'
                    : 'text-neutral-600 hover:text-[#241A16]'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#F16524]" />
                <span>Summary</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAiTab('notes')}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                  activeAiTab === 'notes'
                    ? 'bg-white text-[#241A16] border-[1.5px] border-[#241A16] shadow-[1px_1px_0_#241A16]'
                    : 'text-neutral-600 hover:text-[#241A16]'
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-[#F16524]" />
                <span>Study Notes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAiTab('assistant')}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                  activeAiTab === 'assistant'
                    ? 'bg-white text-[#241A16] border-[1.5px] border-[#241A16] shadow-[1px_1px_0_#241A16]'
                    : 'text-neutral-600 hover:text-[#241A16]'
                }`}
              >
                <Bot className="h-3.5 w-3.5 text-[#F16524]" />
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          {activeAiTab === 'summary' && (
            <AILessonSummary
              lessonId={lessonId}
              lessonTitle={currentLesson.title}
            />
          )}

          {activeAiTab === 'notes' && (
            <AIStudyNotes
              lessonId={lessonId}
              lessonTitle={currentLesson.title}
              courseId={courseId}
              courseTitle={course?.title}
            />
          )}

          {activeAiTab === 'assistant' && (
            <AIStudyAssistantPanel
              lessonId={lessonId}
              lessonTitle={currentLesson.title}
              moduleTitle={currentModule?.title || ''}
            />
          )}
        </div>

        {/* Course Completion Banner */}
        {courseProgress?.completed && (
          <div className="ks-neo-card p-6 text-center space-y-2">
            <span className="text-3xl">🎉</span>
            <h3 className="ks-card-title text-xl text-emerald-800">Course Completed!</h3>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
              You've completed all {lessonList.length} lessons in {course.title}. Your learning journey is complete!
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                to={`/courses/${courseId}`}
                className="ks-neo-btn-primary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider"
              >
                Review Course
              </Link>
              <Link
                to="/courses"
                className="ks-neo-btn-secondary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider"
              >
                Back to Courses
              </Link>
            </div>
          </div>
        )}

        {/* Lesson Completed — Up Next Recommendation Banner */}
        {completed && nextLesson && !courseProgress?.completed && (
          <div className="ks-neo-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider">
                <span>✓ LESSON COMPLETE</span>
              </div>
              <p className="ks-card-title text-base text-[#241A16]">
                Up next: {nextLesson.title}
              </p>
              <p className="text-xs text-neutral-600">
                Continue your learning path.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
              className="ks-neo-btn-primary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              <span>Next Lesson</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Bottom Control Bar (Previous, Next, Mark Complete) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(36,26,22,0.12)] pt-6">
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!prevLesson}
              onClick={() => prevLesson && navigate(`/courses/${courseId}/lessons/${prevLesson.id}`)}
              className="ks-neo-btn-secondary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous Lesson
            </button>
            <button
              type="button"
              disabled={!nextLesson}
              onClick={() => nextLesson && navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
              className="ks-neo-btn-secondary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next Lesson →
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleComplete}
            disabled={isBusy}
            className={`text-xs font-mono font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${
              completed
                ? 'rounded border border-[#241A16] bg-emerald-50 px-5 py-2.5 text-emerald-800 shadow-[1px_1px_0_#241A16]'
                : 'ks-neo-btn-primary px-5 py-2.5'
            }`}
          >
            {completed ? '✓ Completed — Mark Incomplete' : 'Mark Complete →'}
          </button>
        </div>
      </main>
    </div>
  )
}