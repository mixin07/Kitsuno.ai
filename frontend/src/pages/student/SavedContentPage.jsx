import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Bookmark,
  Layers,
  PlayCircle,
  FileText,
  Search,
  X,
  Trash2,
  Download,
  Copy,
  Check,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import {
  listSavedCourses,
  unsaveCourse,
  listSavedLessons,
  unsaveLesson,
  listSavedNotes,
  unsaveNote,
} from '../../services/savedService.js'
import { listMyEnrollments } from '../../services/enrollmentService.js'
import { getCourseCover } from '../../utils/courseCovers.js'
import { generateStudyNotesPDF } from '../../utils/pdfGenerator.js'
import NeoMetricCard from '../../components/NeoMetricCard.jsx'
import StateMessage from '../../components/StateMessage.jsx'
import ProgressBar from '../../components/learning/ProgressBar.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

export default function SavedContentPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'all'

  const [activeTab, setActiveTab] = useState(initialTab) // 'all' | 'courses' | 'lessons' | 'notes'
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [savedCourses, setSavedCourses] = useState([])
  const [savedLessons, setSavedLessons] = useState([])
  const [savedNotes, setSavedNotes] = useState([])
  const [enrollments, setEnrollments] = useState([])

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copiedNoteId, setCopiedNoteId] = useState(null)

  const loadAllSaved = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [coursesRes, lessonsRes, notesRes, enrollRes] = await Promise.allSettled([
        listSavedCourses(),
        listSavedLessons(),
        listSavedNotes(),
        listMyEnrollments(),
      ])

      if (coursesRes.status === 'fulfilled') setSavedCourses(coursesRes.value || [])
      if (lessonsRes.status === 'fulfilled') setSavedLessons(lessonsRes.value || [])
      if (notesRes.status === 'fulfilled') setSavedNotes(notesRes.value || [])
      if (enrollRes.status === 'fulfilled') setEnrollments(enrollRes.value || [])
    } catch (err) {
      setError(err?.message || 'Failed to load saved items.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAllSaved()
  }, [loadAllSaved])

  function handleTabChange(tab) {
    setActiveTab(tab)
    setSearchParams(tab === 'all' ? {} : { tab })
  }

  async function confirmUnsave() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget.type === 'course') {
        await unsaveCourse(deleteTarget.id)
        setSavedCourses((prev) => prev.filter((c) => c.course_id !== deleteTarget.id))
      } else if (deleteTarget.type === 'lesson') {
        await unsaveLesson(deleteTarget.id)
        setSavedLessons((prev) => prev.filter((l) => l.lesson_id !== deleteTarget.id))
      } else if (deleteTarget.type === 'note') {
        await unsaveNote(deleteTarget.id)
        setSavedNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id))
      }
      setDeleteTarget(null)
    } catch (err) {
      setError(err?.message || 'Failed to remove saved item.')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleCopyNote(note) {
    if (!note?.note_content) return
    navigator.clipboard.writeText(note.note_content)
    setCopiedNoteId(note.id)
    setTimeout(() => setCopiedNoteId(null), 2000)
  }

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return savedCourses
    const q = searchQuery.toLowerCase()
    return savedCourses.filter(
      (c) =>
        c.course?.title?.toLowerCase().includes(q) ||
        c.course?.description?.toLowerCase().includes(q) ||
        c.course?.category?.toLowerCase().includes(q)
    )
  }, [savedCourses, searchQuery])

  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return savedLessons
    const q = searchQuery.toLowerCase()
    return savedLessons.filter(
      (l) =>
        l.lesson?.title?.toLowerCase().includes(q) ||
        l.course?.title?.toLowerCase().includes(q) ||
        l.module?.title?.toLowerCase().includes(q)
    )
  }, [savedLessons, searchQuery])

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return savedNotes
    const q = searchQuery.toLowerCase()
    return savedNotes.filter(
      (n) =>
        n.lesson_title?.toLowerCase().includes(q) ||
        n.course_title?.toLowerCase().includes(q) ||
        n.note_content?.toLowerCase().includes(q)
    )
  }, [savedNotes, searchQuery])

  const totalSavedCount = savedCourses.length + savedLessons.length + savedNotes.length

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StateMessage
          type="loading"
          title="Loading Saved Materials"
          message="Retrieving your bookmarked courses, lessons, and personalized AI notes..."
        />
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 text-[#241A16] pb-16">
      {/* 1. Header Zone */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#241A16] pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#F16524]">
            <Bookmark className="w-3.5 h-3.5 shrink-0" />
            <span>STUDENT ARCHIVE</span>
          </div>
          <h1
            className="ks-page-title text-3xl sm:text-4xl font-normal text-[#241A16] tracking-tight leading-tight mt-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Saved Content
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xl leading-relaxed">
            Your personal library of bookmarked courses, individual lessons, and generated AI study notes.
          </p>
        </div>

        <Link
          to="/courses"
          className="ks-neo-btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold self-start sm:self-auto cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Explore Catalog</span>
        </Link>
      </div>

      {/* 2. KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <NeoMetricCard
          label="Total Saved"
          value={totalSavedCount}
          icon={Bookmark}
          hint="All bookmarked learning items"
        />
        <NeoMetricCard
          label="Saved Courses"
          value={savedCourses.length}
          icon={Layers}
          hint="Full curricula saved for study"
        />
        <NeoMetricCard
          label="Saved Lessons"
          value={savedLessons.length}
          icon={PlayCircle}
          hint="Specific lessons pinned for review"
        />
        <NeoMetricCard
          label="AI Study Notes"
          value={savedNotes.length}
          icon={FileText}
          hint="AI summaries & revision sheets"
        />
      </div>

      {/* 3. Main Workspace Card */}
      <div className="ks-neo-card bg-white p-5 sm:p-6 rounded-[8px] border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16] space-y-5">
        {/* Toolbar: Tabs & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b-2 border-[#241A16]">
          {/* Tabs */}
          <div className="inline-flex rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-1 shadow-[1.5px_1.5px_0_#241A16] overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: `All (${totalSavedCount})` },
              { id: 'courses', label: `Courses (${savedCourses.length})` },
              { id: 'lessons', label: `Lessons (${savedLessons.length})` },
              { id: 'notes', label: `AI Notes (${savedNotes.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`rounded-[4px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#F16524] text-white shadow-[1px_1px_0_#241A16]'
                    : 'text-[#241A16] hover:bg-[#FFF2E6]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search saved materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[6px] border-[1.5px] border-[#241A16] bg-white pl-8 pr-7 py-2 font-mono text-xs text-[#241A16] placeholder:text-neutral-400 shadow-[2px_2px_0_#241A16] focus:border-[#F16524] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#241A16] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FEF2F2] p-3 text-xs text-[#991B1B] shadow-[2px_2px_0_#241A16]">
            {error}
          </div>
        )}

        {/* TAB: COURSES */}
        {(activeTab === 'all' || activeTab === 'courses') && (
          <div className="space-y-3">
            {activeTab === 'all' && (
              <div className="flex items-center justify-between pt-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#241A16] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#F16524]" />
                  <span>Saved Courses ({filteredCourses.length})</span>
                </h2>
              </div>
            )}

            {filteredCourses.length === 0 ? (
              activeTab === 'courses' && (
                <div className="py-12 text-center border-2 border-dashed border-[#241A16]/20 rounded-[8px] bg-[#FAF8F5] p-6 space-y-2">
                  <Bookmark className="mx-auto w-8 h-8 text-neutral-400" />
                  <p className="font-bold text-sm text-[#241A16]">No saved courses found</p>
                  <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                    Save courses from the catalog to build your learning wishlist.
                  </p>
                  <Link
                    to="/courses"
                    className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold mt-2"
                  >
                    <span>Browse Courses</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((item) => {
                  const course = item.course || {}
                  const enroll = enrollments.find((e) => e.course_id === item.course_id)
                  const progress = Math.round(enroll?.progress ?? 0)

                  return (
                    <div
                      key={item.id}
                      className="rounded-[8px] border-[1.5px] border-[#241A16] bg-white shadow-[2px_2px_0_#241A16] flex flex-col justify-between overflow-hidden"
                    >
                      <div className="relative h-28 w-full overflow-hidden bg-[#FAF8F5] border-b-[1.5px] border-[#241A16]">
                        <img
                          src={getCourseCover(course)}
                          alt={course.title || 'Course'}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="rounded-[4px] border border-[#241A16] bg-white px-2 py-0.5 text-[9px] font-mono font-bold uppercase text-[#241A16] shadow-[1px_1px_0_#241A16]">
                            {course.category || 'Web Development'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <Link
                            to={`/courses/${item.course_id}`}
                            className="font-serif font-bold text-base text-[#241A16] hover:text-[#F16524] transition-colors line-clamp-1"
                          >
                            {course.title || `Course #${item.course_id}`}
                          </Link>
                          {course.description && (
                            <p className="text-xs text-neutral-600 line-clamp-2 mt-1 leading-relaxed">
                              {course.description}
                            </p>
                          )}
                          {enroll && (
                            <div className="space-y-1 pt-2">
                              <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
                                <span>Progress</span>
                                <span>{progress}%</span>
                              </div>
                              <ProgressBar value={progress} />
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#241A16]/10 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'course',
                                id: item.course_id,
                                title: course.title,
                              })
                            }
                            className="p-1.5 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Remove from saved"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/courses/${item.course_id}`}
                            className="ks-neo-btn-primary px-3 py-1 text-xs font-bold inline-flex items-center gap-1"
                          >
                            <span>Open Course</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: LESSONS */}
        {(activeTab === 'all' || activeTab === 'lessons') && (
          <div className="space-y-3 pt-4 border-t-2 border-[#241A16]/10">
            {activeTab === 'all' && (
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#241A16] flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4 text-[#F16524]" />
                <span>Saved Lessons ({filteredLessons.length})</span>
              </h2>
            )}

            {filteredLessons.length === 0 ? (
              activeTab === 'lessons' && (
                <div className="py-12 text-center border-2 border-dashed border-[#241A16]/20 rounded-[8px] bg-[#FAF8F5] p-6 space-y-2">
                  <PlayCircle className="mx-auto w-8 h-8 text-neutral-400" />
                  <p className="font-bold text-sm text-[#241A16]">No saved lessons found</p>
                  <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                    Bookmark key lessons while studying to jump right back into them anytime.
                  </p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredLessons.map((item) => {
                  const lesson = item.lesson || {}
                  const course = item.course || {}
                  return (
                    <div
                      key={item.id}
                      className="rounded-[6px] border-[1.5px] border-[#241A16] bg-white p-3.5 shadow-[2px_2px_0_#241A16] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#F16524] font-bold block truncate">
                          {course.title || 'Course'}
                        </span>
                        <p className="font-semibold text-sm text-[#241A16] truncate">
                          {lesson.title || `Lesson #${item.lesson_id}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              type: 'lesson',
                              id: item.lesson_id,
                              title: lesson.title,
                            })
                          }
                          className="p-1.5 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/courses/${item.course_id}/lessons/${item.lesson_id}`}
                          className="ks-neo-btn-primary px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <span>Study</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: NOTES */}
        {(activeTab === 'all' || activeTab === 'notes') && (
          <div className="space-y-3 pt-4 border-t-2 border-[#241A16]/10">
            {activeTab === 'all' && (
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#241A16] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#F16524]" />
                <span>AI Study Notes ({filteredNotes.length})</span>
              </h2>
            )}

            {filteredNotes.length === 0 ? (
              activeTab === 'notes' && (
                <div className="py-12 text-center border-2 border-dashed border-[#241A16]/20 rounded-[8px] bg-[#FAF8F5] p-6 space-y-2">
                  <FileText className="mx-auto w-8 h-8 text-neutral-400" />
                  <p className="font-bold text-sm text-[#241A16]">No AI study notes saved yet</p>
                  <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                    Generate study notes in lesson learning mode and click &quot;Save Note&quot; to keep them here.
                  </p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-[8px] border-[1.5px] border-[#241A16] bg-white p-4 shadow-[2px_2px_0_#241A16] flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#241A16]/10">
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#F16524]">
                          {note.course_title || 'Course'}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-base text-[#241A16] mt-2 line-clamp-1">
                        {note.lesson_title || 'Study Notes'}
                      </h3>
                      <div className="mt-2 p-2.5 rounded-[4px] bg-[#FAF8F5] border border-[#241A16]/10 text-xs text-neutral-700 max-h-32 overflow-y-auto leading-relaxed scrollbar-thin">
                        <pre className="font-sans whitespace-pre-wrap">{note.note_content}</pre>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#241A16]/10 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'note',
                            id: note.id,
                            title: note.lesson_title || 'Study Note',
                          })
                        }
                        className="p-1.5 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyNote(note)}
                          className="ks-neo-btn-secondary px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedNoteId === note.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            generateStudyNotesPDF({
                              courseTitle: note.course_title,
                              lessonTitle: note.lesson_title,
                              notes: note.note_content,
                            })
                          }
                          className="ks-neo-btn-primary px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmUnsave}
        title="Remove Saved Item"
        message={`Are you sure you want to remove "${deleteTarget?.title || 'this item'}" from your saved materials?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </main>
  )
}
