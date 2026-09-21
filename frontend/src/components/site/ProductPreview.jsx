import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'

const PROGRESS_TARGET = 68
const PROGRESS_STEPS = [0, 12, 28, 45, 57, 68]
const PROGRESS_STEP_MS = 240

const QUIZ_STATES = [
  {
    q: 'Which activation introduces non-linearity into a network?',
    options: ['ReLU', 'Sigmoid'],
    answer: 0,
  },
  {
    q: 'What does gradient descent minimize?',
    options: ['Loss', 'Accuracy'],
    answer: 0,
  },
  {
    q: 'Which layer helps extract spatial features?',
    options: ['Convolution', 'Dropout'],
    answer: 0,
  },
]
const QUIZ_HOLD_MS = 5000
const QUIZ_EXIT_MS = 220

const ACTIVITY_BASE = [20, 34, 28, 48, 43, 61, 82]
const ACTIVITY_VARY_MS = 7000

export default function ProductPreview({ active = false }) {
  const reduceMotion = usePrefersReducedMotion()
  const live = active && !reduceMotion

  const [progress, setProgress] = useState(active ? PROGRESS_TARGET : 0)
  const [progressDone, setProgressDone] = useState(active)
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizLeaving, setQuizLeaving] = useState(false)
  const [bars, setBars] = useState(active ? ACTIVITY_BASE : ACTIVITY_BASE.map(() => 0))
  const timers = useRef([])

  /* Progress count-up + bar fill, started on entrance */
  useEffect(() => {
    if (!active || reduceMotion) {
      setProgress(PROGRESS_TARGET)
      setProgressDone(true)
      return undefined
    }
    setProgress(0)
    setProgressDone(false)
    timers.current.push(
      ...PROGRESS_STEPS.slice(1).map((value, i) =>
        window.setTimeout(() => {
          setProgress(value)
          if (i === PROGRESS_STEPS.length - 2) setProgressDone(true)
        }, PROGRESS_STEP_MS * (i + 1)),
      ),
    )
    return undefined
  }, [active, reduceMotion])

  /* Quiz cycler */
  useEffect(() => {
    if (!live) return undefined
    const id = window.setInterval(() => {
      setQuizLeaving(true)
      timers.current.push(
        window.setTimeout(() => {
          setQuizIndex((i) => (i + 1) % QUIZ_STATES.length)
          setQuizLeaving(false)
        }, QUIZ_EXIT_MS),
      )
    }, QUIZ_HOLD_MS)
    return () => window.clearInterval(id)
  }, [live])

  /* Activity bars: grow on entrance, then breathe very subtly */
  useEffect(() => {
    if (!active || reduceMotion) {
      setBars(ACTIVITY_BASE)
      return undefined
    }
    setBars(ACTIVITY_BASE.map(() => 0))
    timers.current.push(
      window.setTimeout(() => setBars(ACTIVITY_BASE), 120),
    )
    const id = window.setInterval(() => {
      setBars((prev) =>
        prev.map((h, i) => {
          const drift = ((i * 37 + Date.now() / 1000) % 5) - 2
          return Math.max(8, Math.min(96, ACTIVITY_BASE[i] + Math.round(drift)))
        }),
      )
    }, ACTIVITY_VARY_MS)
    return () => window.clearInterval(id)
  }, [active, reduceMotion])

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const quiz = QUIZ_STATES[quizIndex]

  return (
    <div
      className={`ks-preview${live ? ' is-live' : ''}${
        progressDone ? ' is-progress-done' : ''
      }`}
      aria-hidden="true"
    >
      <div className="ks-preview__glow" />

      <div className="ks-preview__frame">
        <div className="ks-preview__bar">
          <span className="ks-preview__dot" />
          <span className="ks-preview__dot" />
          <span className="ks-preview__dot ks-preview__dot--fox" />
          <span className="ks-preview__url">app.kitsuno.ai</span>
        </div>

        <div className="ks-preview__body">
          <aside className="ks-preview__side">
            <span className="ks-preview__side-item ks-preview__side-item--active">
              <span className="ks-preview__side-dot" />
              Overview
            </span>
            <span className="ks-preview__side-item">Courses</span>
            <span className="ks-preview__side-item">Quizzes</span>
            <span className="ks-preview__side-item">Analytics</span>
          </aside>

          <div className="ks-preview__main">
            <div className="ks-preview__head">
              <div>
                <p className="ks-preview__hello">Good evening, Aarav</p>
                <p className="ks-preview__sub">
                  Two lessons left in this module.
                </p>
              </div>
              <span className="ks-preview__chip ks-preview__chip--fox">
                AI quiz ready
              </span>
            </div>

            <div className="ks-preview__card">
              <div className="ks-preview__card-top">
                <span className="ks-preview__label">Continue learning</span>
                <span className="ks-preview__value">{progress}%</span>
              </div>
              <p className="ks-preview__card-title">
                Applied Machine Learning
              </p>
              <div className="ks-preview__track">
                <span
                  className="ks-preview__fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="ks-preview__card-foot">
                <span>Module 4 · Neural Networks</span>
                <span className="ks-preview__resume">Resume</span>
              </div>
            </div>

            <div className="ks-preview__grid">
              <div className="ks-preview__card ks-preview__card--tight">
                <span className="ks-preview__label">Quiz · AI generated</span>
                <div
                  key={quizIndex}
                  className={`ks-preview__quizswap${
                    quizLeaving ? ' is-leaving' : ''
                  }`}
                >
                  <p className="ks-preview__q">{quiz.q}</p>
                  {quiz.options.map((opt, i) => (
                    <div
                      key={opt}
                      className={`ks-preview__opt${
                        i === quiz.answer ? ' ks-preview__opt--on' : ''
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>

              <div className="ks-preview__card ks-preview__card--tight">
                <span className="ks-preview__label">Weekly activity</span>
                <div className="ks-preview__bars">
                  {bars.map((height, index) => (
                    <span
                      key={index}
                      className={`ks-preview__bar-col${
                        index === bars.length - 1 ? ' is-peak' : ''
                      }`}
                      style={{
                        height: `${height}%`,
                        transitionDelay: `${index * 90}ms`,
                      }}
                    />
                  ))}
                </div>
                <div className="ks-preview__stats">
                  <span>
                    <b>92%</b> avg score
                  </span>
                  <span>
                    <b>14</b> quizzes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
