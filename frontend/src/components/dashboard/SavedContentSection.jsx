import { Link } from 'react-router-dom'
import {
  Bookmark,
  BookOpen,
  FileText,
  Sparkles,
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react'

export default function SavedContentSection({ savedOverview, gamification }) {
  const savedCoursesCount = savedOverview?.saved_course_ids?.length || 0
  const savedLessonsCount = savedOverview?.saved_lesson_ids?.length || 0
  const savedNotesCount = savedOverview?.saved_note_lesson_ids?.length || 0
  const totalSaved = savedCoursesCount + savedLessonsCount + savedNotesCount

  const achievements = gamification?.achievements || []
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="ks-neo-card-static p-4 sm:p-5 flex flex-col justify-between space-y-3 h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-[#241A16]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F16524]">
                SAVED MATERIALS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F16524]" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Bookmark className="h-4 w-4 text-[#F16524]" />
              <h3 className="ks-card-title text-xl md:text-2xl font-serif text-[#241A16] font-normal leading-tight">
                Saved &amp; Milestones
              </h3>
            </div>
          </div>
          <Link
            to="/student/learning?tab=saved"
            className="text-xs font-bold text-[#F16524] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>View Saved</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Saved Content Quick Categories - Secondary: No Hard Shadow */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Link
            to="/student/learning?tab=saved"
            className="p-2.5 rounded-[6px] border-[1.5px] border-[#241A16]/25 bg-white hover:border-[#241A16] hover:bg-[#FFF4EB] transition-all text-center block group"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-[4px] border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524] mx-auto mb-1">
              <BookOpen className="h-3 w-3" />
            </div>
            <p className="text-base font-bold text-[#241A16] group-hover:text-[#F16524] transition-colors leading-none">
              {savedCoursesCount}
            </p>
            <p className="text-[10px] font-medium text-[#241A16]/70 mt-0.5">Courses</p>
          </Link>

          <Link
            to="/student/learning?tab=saved"
            className="p-2.5 rounded-[6px] border-[1.5px] border-[#241A16]/25 bg-white hover:border-[#241A16] hover:bg-[#FFF4EB] transition-all text-center block group"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-[4px] border-[1.5px] border-[#241A16] bg-sky-50 text-sky-700 mx-auto mb-1">
              <FileText className="h-3 w-3" />
            </div>
            <p className="text-base font-bold text-[#241A16] group-hover:text-sky-700 transition-colors leading-none">
              {savedLessonsCount}
            </p>
            <p className="text-[10px] font-medium text-[#241A16]/70 mt-0.5">Lessons</p>
          </Link>

          <Link
            to="/student/learning?tab=saved"
            className="p-2.5 rounded-[6px] border-[1.5px] border-[#241A16]/25 bg-white hover:border-[#241A16] hover:bg-[#FFF4EB] transition-all text-center block group"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-[4px] border-[1.5px] border-[#241A16] bg-purple-50 text-purple-700 mx-auto mb-1">
              <Sparkles className="h-3 w-3" />
            </div>
            <p className="text-base font-bold text-[#241A16] group-hover:text-purple-700 transition-colors leading-none">
              {savedNotesCount}
            </p>
            <p className="text-[10px] font-medium text-[#241A16]/70 mt-0.5">AI Notes</p>
          </Link>
        </div>

        {/* Achievements Snapshot */}
        <div className="mt-3 pt-2.5 border-t-[1.5px] border-[#241A16]/15 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#241A16]">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              <span>Earned Badges</span>
            </div>
            <span className="text-[10.5px] font-medium text-[#241A16]/70">
              {unlockedCount} / {achievements.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {achievements.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className={`p-2 rounded-[6px] border-[1.5px] text-xs flex items-center justify-between gap-1.5 transition-colors ${
                  item.unlocked
                    ? 'bg-white border-[#241A16]/40'
                    : 'bg-[#FFFAF4]/50 border-[#241A16]/15 opacity-70'
                }`}
              >
                <div className="min-w-0 truncate">
                  <p className="font-bold text-[11px] text-[#241A16] truncate leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[9.5px] font-normal text-[#241A16]/70 truncate">
                    {item.unlocked ? '✓ Completed' : 'In progress'}
                  </p>
                </div>
                {item.unlocked ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Lock className="h-3 w-3 text-[#241A16]/40 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t-[1.5px] border-[#241A16]/15 flex items-center justify-between text-[11px] text-[#241A16]/70">
        <span className="font-normal">{totalSaved} total bookmarked learning items</span>
        <Link
          to="/student/learning?tab=saved"
          className="font-bold text-[#F16524] hover:underline inline-flex items-center gap-0.5"
        >
          <span>Open Library →</span>
        </Link>
      </div>
    </div>
  )
}
