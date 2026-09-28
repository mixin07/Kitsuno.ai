import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ArrowRight, Bookmark } from 'lucide-react'
import { DIFFICULTY_LABELS } from '../../constants/courses.js'
import ProgressBar from '../learning/ProgressBar.jsx'

export default function MyCoursesSection({ enrollments }) {
  const [activeTab, setActiveTab] = useState('in_progress') // 'in_progress' | 'completed' | 'saved'

  const inProgressEnrollments = (enrollments || []).filter((e) => (e.progress ?? 0) < 100)
  const completedEnrollments = (enrollments || []).filter((e) => (e.progress ?? 0) >= 100)

  const currentList = (() => {
    if (activeTab === 'completed') return completedEnrollments
    if (activeTab === 'saved') return []
    return inProgressEnrollments
  })()

  return (
    <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] space-y-4 shadow-xs overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-[var(--ks-border)]">
        <div>
          <h2 className="ks-section-title font-serif text-lg">
            My Courses
          </h2>
          <p className="text-[11px] text-[var(--ks-text-muted)]">
            Enrolled curriculum and lesson progress breakdown
          </p>
        </div>

        {/* Editorial Tab Switcher */}
        <div className="flex items-center gap-1 border-b border-[var(--ks-border)] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('in_progress')}
            className={`editorial-tab ${activeTab === 'in_progress' ? 'editorial-tab--active' : ''}`}
          >
            In Progress ({inProgressEnrollments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`editorial-tab ${activeTab === 'completed' ? 'editorial-tab--active' : ''}`}
          >
            Completed ({completedEnrollments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`editorial-tab ${activeTab === 'saved' ? 'editorial-tab--active' : ''}`}
          >
            Saved (0)
          </button>
        </div>
      </div>

      {currentList.length > 0 ? (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((item) => {
            const course = item.course || {}
            const diffLabel = DIFFICULTY_LABELS[course.difficulty] || course.difficulty || 'All Levels'
            const progress = item.progress ?? 0
            const isDone = progress >= 100
            const nextLesson = item.next_lesson

            return (
              <div
                key={item.id}
                className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 space-y-3 transition-all hover:border-[var(--ks-orange)]/40 hover:shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-[var(--ks-orange)] bg-[var(--ks-orange)]/10 px-2 py-0.5 rounded border border-[var(--ks-orange)]/20">
                      {course.category || 'General'}
                    </span>
                    <span className="text-[11px] text-[var(--ks-text-subtle)] font-medium">
                      Level: {diffLabel}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-[var(--ks-text)] line-clamp-1">
                    {course.title}
                  </h3>

                  <p className="text-xs text-[var(--ks-text-muted)] line-clamp-1">
                    {nextLesson ? `Next: ${nextLesson.title}` : isDone ? 'All lessons completed!' : 'Start learning'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--ks-border)]/60">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ks-text-muted)]">
                    <span>{progress}% complete</span>
                    <span>
                      {item.completed_lessons || 0} / {item.total_lessons || 0} lessons
                    </span>
                  </div>
                  <ProgressBar value={progress} className="h-1.5" />

                  <div className="pt-1 flex items-center justify-between">
                    <Link
                      to={
                        nextLesson
                          ? `/courses/${item.course_id}/lessons/${nextLesson.id}`
                          : `/courses/${item.course_id}`
                      }
                      className="inline-flex items-center gap-1 rounded border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ks-text)] transition hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)]"
                    >
                      <span>{isDone ? 'Review' : 'Continue'}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>

                    <Link
                      to={`/courses/${item.course_id}`}
                      className="text-xs text-[var(--ks-text-muted)] hover:text-[var(--ks-text)] font-medium"
                    >
                      Course page
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-[var(--ks-text-muted)] space-y-3">
          {(!enrollments || enrollments.length === 0) ? (
            <>
              <BookOpen className="mx-auto h-8 w-8 text-[var(--ks-text-subtle)] opacity-60" />
              <h3 className="font-serif text-sm font-semibold text-[var(--ks-text)]">No Enrolled Courses</h3>
              <p className="max-w-xs mx-auto">
                You are not enrolled in any courses yet. Explore our curriculum catalog to start learning.
              </p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ks-orange)] bg-[var(--ks-orange)] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#E0520D]"
              >
                <span>Explore Courses →</span>
              </Link>
            </>
          ) : activeTab === 'saved' ? (
            <>
              <Bookmark className="mx-auto h-6 w-6 text-[var(--ks-text-subtle)] opacity-60" />
              <p>No saved courses yet. Bookmark courses from the catalog to save them for later.</p>
            </>
          ) : (
            <>
              <BookOpen className="mx-auto h-6 w-6 text-[var(--ks-text-subtle)] opacity-60" />
              <p>No courses match this filter.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
