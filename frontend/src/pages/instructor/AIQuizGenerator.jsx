import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../services/api.js'
import {
  generateQuizQuestions,
  saveQuizQuestions,
} from '../../services/aiService.js'
import { listCourses } from '../../services/courseService.js'
import { listModules } from '../../services/moduleService.js'
import { listLessons } from '../../services/lessonService.js'
import { ROLES } from '../../constants/roles.js'
import { useAuth } from '../../hooks/useAuth.js'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import StateMessage from '../../components/StateMessage.jsx'

const INPUT_CLASS =
  'w-full rounded-[6px] border-2 border-[#241A16] bg-white px-3.5 py-2 text-xs font-medium text-[#241A16] shadow-[2px_2px_0_#241A16] outline-none transition placeholder:text-neutral-400 focus:border-[#F16524] focus:ring-0 disabled:opacity-50'
const LABEL_CLASS = 'mb-1.5 block text-[11px] font-mono font-bold uppercase tracking-wider text-[#241A16]'
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD']
const MAX_QUESTIONS = 10

function buildQuestions(payload) {
  return payload.questions.map((question) => ({
    question_text: question.question_text,
    question_type: 'MCQ',
    points: question.points,
    options: question.options.map((option) => ({
      option_text: option.option_text,
      is_correct: option.is_correct,
    })),
  }))
}

export default function AIQuizGenerator() {
  const { user } = useAuth()

  const [courses, setCourses] = useState([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [modules, setModules] = useState([])
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [lessons, setLessons] = useState([])
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [treeLoading, setTreeLoading] = useState(false)

  const [topic, setTopic] = useState('')
  const [numberOfQuestions, setNumberOfQuestions] = useState('3')
  const [difficulty, setDifficulty] = useState('MEDIUM')

  const [questions, setQuestions] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formError, setFormError] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedQuiz, setSavedQuiz] = useState(null)

  const [removeTarget, setRemoveTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoadingCourses(true)
      setLoadError('')
      try {
        const data = await listCourses()
        if (active) setCourses(data)
      } catch (err) {
        if (active) setLoadError(getApiErrorMessage(err))
      } finally {
        if (active) setIsLoadingCourses(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const visibleCourses =
    user?.role === ROLES.ADMIN
      ? courses
      : courses.filter((course) => course.instructor_id === user?.id)

  const selectedCourse = visibleCourses.find(
    (course) => String(course.id) === selectedCourseId,
  )
  const selectedLesson = lessons.find((lesson) => String(lesson.id) === selectedLessonId)

  async function handleCourseChange(courseId) {
    setSelectedCourseId(courseId)
    setSelectedModuleId('')
    setLessons([])
    setSelectedLessonId('')
    setQuestions(null)
    setFormError('')
    if (!courseId) return

    setTreeLoading(true)
    try {
      const data = await listModules(courseId)
      setModules(data)
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setTreeLoading(false)
    }
  }

  async function handleModuleChange(moduleId) {
    setSelectedModuleId(moduleId)
    setLessons([])
    setSelectedLessonId('')
    setQuestions(null)
    setFormError('')
    if (!moduleId || !selectedCourseId) return

    setTreeLoading(true)
    try {
      const data = await listLessons(selectedCourseId, moduleId)
      setLessons(data)
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setTreeLoading(false)
    }
  }

  function validateGenerateRequest() {
    if (!selectedLessonId) return 'Select a lesson first.'
    if (topic.trim().length < 3) return 'Topic must be at least 3 characters.'
    const count = Number(numberOfQuestions)
    if (!Number.isInteger(count) || count < 1 || count > MAX_QUESTIONS) {
      return `Number of questions must be a whole number between 1 and ${MAX_QUESTIONS}.`
    }
    return ''
  }

  async function handleGenerate() {
    const validationError = validateGenerateRequest()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setIsGenerating(true)
    setFormError('')
    setSaveError('')
    try {
      const payload = {
        lesson_id: Number(selectedLessonId),
        topic: topic.trim(),
        number_of_questions: Number(numberOfQuestions),
        difficulty,
        question_type: 'MCQ',
      }
      const result = await generateQuizQuestions(payload)
      setQuestions(buildQuestions(result))
      setSavedQuiz(null)
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setIsGenerating(false)
    }
  }

  function updateQuestion(index, patch) {
    setQuestions((prev) =>
      prev.map((question, i) => (i === index ? { ...question, ...patch } : question)),
    )
  }

  function updateOption(questionIndex, optionIndex, patch) {
    setQuestions((prev) =>
      prev.map((question, i) => {
        if (i !== questionIndex) return question
        return {
          ...question,
          options: question.options.map((option, j) =>
            j === optionIndex ? { ...option, ...patch } : option,
          ),
        }
      }),
    )
  }

  function handleSetCorrect(questionIndex, optionIndex) {
    setQuestions((prev) =>
      prev.map((question, i) => {
        if (i !== questionIndex) return question
        return {
          ...question,
          options: question.options.map((option, j) => ({
            ...option,
            is_correct: j === optionIndex,
          })),
        }
      }),
    )
  }

  function handleConfirmRemoveQuestion() {
    if (removeTarget == null) return
    setDeleting(true)
    setDeleteError('')
    try {
      setQuestions((prev) => prev.filter((_, i) => i !== removeTarget))
      setRemoveTarget(null)
    } catch (err) {
      setDeleteError(getApiErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  function validateSavePayload() {
    if (!questions || questions.length === 0) return 'Add at least one question before saving.'
    if (!questions.every((question) => question.question_text.trim())) {
      return 'Every question must have text.'
    }
    for (const question of questions) {
      if (
        !Number.isInteger(question.points) ||
        question.points < 1 ||
        question.points > 100
      ) {
        return 'Every question must have points between 1 and 100.'
      }
      if (question.options.length < 2) return 'Every question needs at least two options.'
      if (!question.options.every((option) => option.option_text.trim())) {
        return 'Every option must have text.'
      }
      const correctCount = question.options.filter((option) => option.is_correct).length
      if (correctCount !== 1) return 'Every question must have exactly one correct option.'
    }
    return ''
  }

  async function handleSave() {
    const validationError = validateSavePayload()
    if (validationError) {
      setSaveError(validationError)
      return
    }

    setIsSaving(true)
    setSaveError('')
    setFormError('')
    try {
      const payload = {
        lesson_id: Number(selectedLessonId),
        questions: questions.map((question) => ({
          question_text: question.question_text.trim(),
          question_type: 'MCQ',
          points: question.points,
          options: question.options.map((option) => ({
            option_text: option.option_text.trim(),
            is_correct: option.is_correct,
          })),
        })),
      }
      const result = await saveQuizQuestions(payload)
      setSavedQuiz(result)
    } catch (err) {
      setSaveError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  function resetGenerator() {
    setQuestions(null)
    setSavedQuiz(null)
    setFormError('')
    setSaveError('')
  }

  if (isLoadingCourses) {
    return <StateMessage variant="loading" title="Loading your courses..." />
  }

  if (loadError) {
    return (
      <StateMessage variant="error" title="Unable to load courses" onRetry={() => window.location.reload()}>
        {loadError}
      </StateMessage>
    )
  }

  if (savedQuiz) {
    return (
      <section className="space-y-6">
        <div className="pb-4 border-b-2 border-[#241A16]">
          <span className="ks-eyebrow block">INSTRUCTOR STUDIO</span>
          <h1 className="ks-page-title mt-0.5">AI Quiz Generator</h1>
        </div>
        <div className="grid gap-6">
          <div className="ks-neo-card rounded-[8px] border-2 border-[#241A16] bg-emerald-50 p-8 text-center shadow-[4px_4px_0_#241A16]">
            <p className="font-serif text-2xl font-normal text-[#241A16]">
              Quiz saved successfully.
            </p>
            <p className="mt-2 text-xs font-medium text-neutral-700 sm:text-sm">
              {savedQuiz.questions.length} question{savedQuiz.questions.length !== 1 && 's'} saved
              to the lesson&apos;s quiz (ID {savedQuiz.quiz_id}).
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to={`/student/quiz/${savedQuiz.quiz_id}?courseId=${selectedCourseId}&lessonId=${selectedLessonId}`}
                className="ks-neo-btn-primary px-5 py-2 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700"
              >
                Go to Quiz
              </Link>
              <Link
                to={`/instructor/courses/${selectedCourseId}/content`}
                className="ks-neo-btn-secondary px-5 py-2 text-xs font-bold"
              >
                Back to Lesson
              </Link>
            </div>
            <p className="mt-4 text-[11px] text-neutral-600">
              Students can take this quiz from the lesson&apos;s learning page.
            </p>
            <button
              type="button"
              onClick={resetGenerator}
              className="mt-6 text-xs font-bold text-[#F16524] hover:underline"
            >
              ← Generate more questions
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="pb-4 border-b-2 border-[#241A16]">
        <Link
          to="/instructor/courses"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#F16524] hover:underline transition-colors"
        >
          ← Back to my courses
        </Link>
        <span className="ks-eyebrow block">INSTRUCTOR STUDIO</span>
        <h1 className="ks-page-title mt-0.5">AI Quiz Generator</h1>
        <p className="ks-muted mt-1">
          Generate quiz questions for a lesson, review and edit them, then save approved
          questions to the lesson&apos;s quiz.
        </p>
      </div>

      {visibleCourses.length === 0 && (
        <StateMessage variant="empty" title="No courses yet">
          Create a course first so you have a lesson to generate questions for.
        </StateMessage>
      )}

      {visibleCourses.length > 0 && (
        <div className="ks-neo-card rounded-[8px] border-2 border-[#241A16] bg-white p-5 sm:p-6 shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16]">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ai-course" className={LABEL_CLASS}>
                Course
              </label>
              <select
                id="ai-course"
                value={selectedCourseId}
                onChange={(event) => handleCourseChange(event.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Select course</option>
                {visibleCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ai-module" className={LABEL_CLASS}>
                Module
              </label>
              <select
                id="ai-module"
                value={selectedModuleId}
                onChange={(event) => handleModuleChange(event.target.value)}
                disabled={!selectedCourseId || treeLoading}
                className={INPUT_CLASS}
              >
                <option value="">{treeLoading ? 'Loading...' : 'Select module'}</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ai-lesson" className={LABEL_CLASS}>
                Lesson
              </label>
              <select
                id="ai-lesson"
                value={selectedLessonId}
                onChange={(event) => {
                  setSelectedLessonId(event.target.value)
                  setQuestions(null)
                  setFormError('')
                }}
                disabled={!selectedModuleId || treeLoading}
                className={INPUT_CLASS}
              >
                <option value="">{treeLoading ? 'Loading...' : 'Select lesson'}</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="ai-topic" className={LABEL_CLASS}>
              Topic / Learning Content
            </label>
            <textarea
              id="ai-topic"
              rows={4}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              disabled={isGenerating}
              className={INPUT_CLASS}
              placeholder="Describe the topic to generate questions about (e.g. Newtonian mechanics: forces, acceleration, and momentum)"
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ai-count" className={LABEL_CLASS}>
                Number of Questions
              </label>
              <input
                id="ai-count"
                type="number"
                min="1"
                max={MAX_QUESTIONS}
                value={numberOfQuestions}
                onChange={(event) => setNumberOfQuestions(event.target.value)}
                disabled={isGenerating}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="ai-difficulty" className={LABEL_CLASS}>
                Difficulty
              </label>
              <select
                id="ai-difficulty"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                disabled={isGenerating}
                className={INPUT_CLASS}
              >
                {DIFFICULTIES.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0) + level.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ai-type" className={LABEL_CLASS}>
                Question Type
              </label>
              <input
                id="ai-type"
                type="text"
                value="Multiple Choice (MCQ)"
                disabled
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {formError && (
            <p
              role="alert"
              className="mt-5 rounded-[6px] border-2 border-rose-400 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 font-mono shadow-[2px_2px_0_#241A16]"
            >
              {formError}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="ks-neo-btn-primary px-5 py-2 text-xs font-bold"
            >
              {isGenerating ? 'Generating...' : 'Generate Questions'}
            </button>
            {questions && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="ks-neo-btn-secondary px-5 py-2 text-xs font-bold"
              >
                Regenerate
              </button>
            )}
          </div>
        </div>
      )}

      {isGenerating && (
        <StateMessage variant="loading" title="Generating questions...">
          The AI provider is drafting questions for this lesson.
        </StateMessage>
      )}

      {!isGenerating && questions && questions.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b-2 border-[#241A16]">
            <div>
              <h2 className="font-serif text-2xl font-normal text-[#241A16]">Generated Questions</h2>
              <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
                {selectedLesson?.title} — Review, edit, and remove anything before saving.
              </p>
            </div>
            <span className="inline-flex items-center rounded-[4px] border border-[#241A16] bg-[#FFF2E6] px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
              {questions.length} question{questions.length !== 1 && 's'}
            </span>
          </div>

          {questions.map((question, qIndex) => {
            const correctIndex = question.options.findIndex((option) => option.is_correct)
            return (
              <div
                key={qIndex}
                className="ks-neo-card rounded-[8px] border-2 border-[#241A16] bg-white p-5 sm:p-6 shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16]"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <span className="inline-flex items-center rounded-[4px] border border-[#241A16] bg-[#FAF8F5] px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#241A16]">
                    Question {qIndex + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('')
                      setRemoveTarget(qIndex)
                    }}
                    className="ks-neo-btn-secondary px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>

                <label className={LABEL_CLASS} htmlFor={`ai-question-${qIndex}`}>
                  Question text
                </label>
                <textarea
                  id={`ai-question-${qIndex}`}
                  rows={2}
                  value={question.question_text}
                  onChange={(event) =>
                    updateQuestion(qIndex, { question_text: event.target.value })
                  }
                  className={INPUT_CLASS}
                />

                <div className="mt-4 space-y-3">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-3">
                      <span className="w-7 shrink-0 text-xs font-bold text-[#241A16]">
                        {String.fromCharCode(65 + oIndex)}.
                      </span>
                      <input
                        type="text"
                        value={option.option_text}
                        onChange={(event) =>
                          updateOption(qIndex, oIndex, { option_text: event.target.value })
                        }
                        className={INPUT_CLASS}
                        aria-label={`Option ${String.fromCharCode(65 + oIndex)}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`ai-correct-${qIndex}`} className={LABEL_CLASS}>
                      Correct Answer
                    </label>
                    <select
                      id={`ai-correct-${qIndex}`}
                      value={correctIndex >= 0 ? correctIndex : ''}
                      onChange={(event) => handleSetCorrect(qIndex, Number(event.target.value))}
                      className={INPUT_CLASS}
                    >
                      <option value="">Select correct option</option>
                      {question.options.map((option, oIndex) => (
                        <option key={oIndex} value={oIndex}>
                          {String.fromCharCode(65 + oIndex)} —{' '}
                          {option.option_text || 'Empty option'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`ai-points-${qIndex}`} className={LABEL_CLASS}>
                      Points
                    </label>
                    <input
                      id={`ai-points-${qIndex}`}
                      type="number"
                      min="1"
                      max="100"
                      value={question.points}
                      onChange={(event) =>
                        updateQuestion(qIndex, { points: Number(event.target.value) })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </div>
            )
          })}

          {saveError && (
            <p
              role="alert"
              className="rounded-[6px] border-2 border-rose-400 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 font-mono shadow-[2px_2px_0_#241A16]"
            >
              {saveError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={resetGenerator}
              disabled={isSaving}
              className="ks-neo-btn-secondary px-5 py-2 text-xs font-bold"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="ks-neo-btn-primary px-6 py-2 text-xs font-bold"
            >
              {isSaving ? 'Saving...' : 'Save to Quiz'}
            </button>
          </div>

          <p className="text-[11px] text-neutral-500">
            Saving writes these approved questions to the {selectedCourse?.title} lesson&apos;s
            quiz. Questions are not saved until you click &quot;Save to Quiz&quot;.
          </p>
        </section>
      )}

      <ConfirmDialog
        open={removeTarget != null}
        title="Remove question?"
        message="Remove this question from the generated set? You can regenerate the questions later."
        error={deleteError}
        isSubmitting={deleting}
        onConfirm={handleConfirmRemoveQuestion}
        onCancel={() => setRemoveTarget(null)}
      />
    </section>
  )
}