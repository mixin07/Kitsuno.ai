import { useState, useEffect, useMemo } from 'react'
import {
  Flame,
  Trophy,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { getMonthlyActivity } from '../../services/headerStatsService.js'

export default function ThisWeekConsistencyCard({ gamification }) {
  const streakInfo = gamification?.streak_info || {}
  const streak = streakInfo?.current_streak ?? 0
  const longestStreak = streakInfo?.longest_streak ?? streak
  const lastActiveDate = streakInfo?.last_active_date

  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => {
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [today])

  const isActiveToday =
    lastActiveDate &&
    (typeof lastActiveDate === 'string'
      ? lastActiveDate.startsWith(todayStr)
      : false)

  const levelInfo = gamification?.level_info || {}
  const level = levelInfo?.current_level ?? 1
  const xp = gamification?.total_xp ?? 0
  const xpIntoLevel = levelInfo?.xp_into_level ?? 0
  const xpRequired = levelInfo?.xp_required_for_next_level ?? 100
  const progressPct = Math.min(
    100,
    Math.max(0, Math.round(levelInfo?.progress_percentage ?? 0))
  )

  // Current calendar view state (defaults to today's year & month)
  const [viewDate, setViewDate] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth() + 1, // 1 to 12
  }))

  const [selectedDate, setSelectedDate] = useState(null)
  const [activityCache, setActivityCache] = useState({})

  const gamificationKey = `${gamification?.total_xp || 0}-${streakInfo?.last_active_date || ''}`
  const cacheKey = `${viewDate.year}-${viewDate.month}-${gamificationKey}`

  // Fetch month activity with local caching
  useEffect(() => {
    if (activityCache[cacheKey]) return
    let active = true

    getMonthlyActivity(viewDate.year, viewDate.month)
      .then((data) => {
        if (active && data) {
          setActivityCache((prev) => ({
            ...prev,
            [cacheKey]: data,
          }))
        }
      })
      .catch((err) => {
        console.warn('Failed to load monthly activity:', err)
      })

    return () => {
      active = false
    }
  }, [viewDate.year, viewDate.month, cacheKey, activityCache])

  // Month navigation handlers
  const handlePrevMonth = () => {
    setViewDate((prev) => {
      const y = prev.month === 1 ? prev.year - 1 : prev.year
      const m = prev.month === 1 ? 12 : prev.month - 1
      return { year: y, month: m }
    })
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setViewDate((prev) => {
      const y = prev.month === 12 ? prev.year + 1 : prev.year
      const m = prev.month === 12 ? 1 : prev.month + 1
      return { year: y, month: m }
    })
    setSelectedDate(null)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const monthName = monthNames[viewDate.month - 1]

  // Generate 7-column calendar grid (Sun to Sat) with 5-6 rows
  const calendarCells = useMemo(() => {
    const { year, month } = viewDate
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay() // 0 = Sun ... 6 = Sat
    const daysInMonth = new Date(year, month, 0).getDate()
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate()

    const cells = []

    // 1. Previous month overflow days
    if (firstDayOfWeek > 0) {
      const prevStart = daysInPrevMonth - firstDayOfWeek + 1
      const prevMonthYear = month === 1 ? year - 1 : year
      const prevMonthNum = month === 1 ? 12 : month - 1
      for (let i = 0; i < firstDayOfWeek; i++) {
        const dayNum = prevStart + i
        const isoDate = `${prevMonthYear}-${String(prevMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        cells.push({
          dayNum,
          isoDate,
          isCurrentMonth: false,
          isToday: false,
        })
      }
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        dayNum: d,
        isoDate,
        isCurrentMonth: true,
        isToday: isoDate === todayStr,
      })
    }

    // 3. Next month overflow days
    const remainder = cells.length % 7
    if (remainder > 0) {
      const overflowCount = 7 - remainder
      const nextMonthYear = month === 12 ? year + 1 : year
      const nextMonthNum = month === 12 ? 1 : month + 1
      for (let n = 1; n <= overflowCount; n++) {
        const isoDate = `${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}-${String(n).padStart(2, '0')}`
        cells.push({
          dayNum: n,
          isoDate,
          isCurrentMonth: false,
          isToday: false,
        })
      }
    }

    return cells
  }, [viewDate, todayStr])

  // Extract active dates and day summaries
  const monthData = activityCache[cacheKey]
  const activeDatesSet = useMemo(() => {
    const set = new Set()
    if (monthData?.active_dates) {
      for (const d of monthData.active_dates) {
        set.add(typeof d === 'string' ? d.split('T')[0] : d)
      }
    }
    // Blend with active streak if viewing the current month
    if (viewDate.year === today.getFullYear() && viewDate.month === today.getMonth() + 1) {
      if (isActiveToday) set.add(todayStr)
      if (streak > 0 && lastActiveDate) {
        const lastDateStr = typeof lastActiveDate === 'string' ? lastActiveDate.split('T')[0] : ''
        if (lastDateStr) {
          const lastD = new Date(lastDateStr)
          for (let i = 0; i < streak; i++) {
            const sd = new Date(lastD)
            sd.setDate(lastD.getDate() - i)
            set.add(sd.toISOString().split('T')[0])
          }
        }
      }
    }
    return set
  }, [monthData, viewDate, today, isActiveToday, todayStr, streak, lastActiveDate])

  const daysDataMap = monthData?.days || {}

  const handleDayClick = (cell) => {
    if (!cell.isCurrentMonth) return
    setSelectedDate((prev) => (prev === cell.isoDate ? null : cell.isoDate))
  }

  const selectedDaySummary = selectedDate ? daysDataMap[selectedDate] : null
  const isSelectedDateActive = selectedDate ? activeDatesSet.has(selectedDate) : false

  const formatSelectedDate = (isoStr) => {
    if (!isoStr) return ''
    const [y, m, d] = isoStr.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="ks-neo-card-static p-4 sm:p-5 flex flex-col justify-between space-y-3.5 h-full">
      {/* Top Section */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-[#241A16]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F16524]">
                STUDY RHYTHM
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F16524]" />
            </div>
            <h3 className="ks-card-title text-xl md:text-2xl font-serif text-[#241A16] font-normal leading-tight mt-0.5">
              Study Activity
            </h3>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-streak-modal'))}
            className="text-xs font-bold text-[#F16524] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Streak Details →</span>
          </button>
        </div>

        {/* Existing Streak Summary Card - Secondary: No Hard Shadow */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-streak-modal'))}
          className="w-full mt-2.5 p-2.5 rounded-[6px] border-[1.5px] border-[#241A16]/25 bg-white hover:border-[#241A16] hover:bg-[#FFF4EB] transition-all text-left group cursor-pointer block"
          aria-label="View streak details"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-[4px] border-[1.5px] border-[#241A16] bg-[#FFF4EB] text-[var(--ks-orange)] shrink-0">
                <Flame className="h-4 w-4 fill-[var(--ks-orange)]" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--ks-text)]">
                    {streak} {streak === 1 ? 'Day' : 'Days'} Streak
                  </span>
                  <span className="text-[10px] text-[var(--ks-text-subtle)] font-medium">
                    (Best: {longestStreak}d)
                  </span>
                </div>
                <p className="text-[10.5px] text-[var(--ks-text-muted)] mt-0.5 flex items-center gap-1">
                  {isActiveToday ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 font-medium">Streak saved for today</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                      <span className="text-amber-800 font-medium">Complete a lesson today</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <Trophy className="h-3.5 w-3.5 text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        {/* Full Monthly Activity Calendar - Secondary Container: 1.5px border, no hard shadow */}
        <div className="rounded-[6px] border-[1.5px] border-[#241A16]/25 bg-white mt-2.5 p-2.5 sm:p-3 space-y-2">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between text-xs font-semibold text-[#241A16]">
            <span className="text-xs font-bold text-[#241A16] tracking-tight">
              Monthly Activity Calendar
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-0.5 rounded-[4px] text-[#241A16] hover:bg-[#FFF4EB] border border-[#241A16]/25 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-bold text-[#241A16] min-w-[90px] text-center select-none">
                {monthName} {viewDate.year}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-0.5 rounded-[4px] text-[#241A16] hover:bg-[#FFF4EB] border border-[#241A16]/25 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday Row (Sun to Sat) */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
              <span
                key={weekday}
                className="text-[10px] font-bold text-[#8F3215]"
              >
                {weekday}
              </span>
            ))}
          </div>

          {/* Month Grid Cells - Compact height */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const isCellActive = cell.isCurrentMonth && activeDatesSet.has(cell.isoDate)
              const daySummary = cell.isCurrentMonth ? daysDataMap[cell.isoDate] : null
              const isStrongActivity = Boolean(
                daySummary &&
                  ((daySummary.activity_count && daySummary.activity_count >= 2) ||
                    (daySummary.xp_earned && daySummary.xp_earned >= 100))
              )
              const isSelected = selectedDate === cell.isoDate

              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={cell.isoDate}
                    className="h-6 sm:h-7 w-full rounded-[4px] flex flex-col items-center justify-center opacity-25 text-[var(--ks-text-subtle)] text-[10px] select-none pointer-events-none"
                  >
                    <span>{cell.dayNum}</span>
                  </div>
                )
              }

              return (
                <button
                  key={cell.isoDate}
                  type="button"
                  onClick={() => handleDayClick(cell)}
                  aria-label={`${monthName} ${cell.dayNum}, ${viewDate.year}${cell.isToday ? ' (Today)' : ''}${isCellActive ? ' - Active' : ''}`}
                  aria-current={cell.isToday ? 'date' : undefined}
                  className={`h-6 sm:h-7 w-full rounded-[4px] flex flex-col items-center justify-center p-0.5 transition-all text-[10px] cursor-pointer ${
                    cell.isToday
                      ? 'border-[1.5px] border-[#241A16] bg-[#F16524] text-white font-bold'
                      : isSelected
                        ? 'border-[1.5px] border-[#241A16] bg-[#FFF4EB] text-[#241A16] font-bold'
                        : isCellActive
                          ? 'border border-[#241A16]/25 bg-[#FFFAF4] text-[#241A16] font-semibold hover:border-[#241A16]'
                          : 'border border-transparent text-[#241A16]/75 hover:bg-[#FFF4EB] hover:text-[#241A16]'
                  }`}
                >
                  <span className="leading-none">{cell.dayNum}</span>
                  <div className="h-1 w-1 flex items-center justify-center mt-0.5">
                    {isCellActive ? (
                      <span
                        className={`rounded-full shrink-0 ${
                          cell.isToday
                            ? 'h-1 w-1 bg-white'
                            : isStrongActivity
                            ? 'h-1.5 w-1.5 bg-[#F16524] ring-1 ring-[#241A16]'
                            : 'h-1 w-1 bg-[#F16524]'
                        }`}
                      />
                    ) : (
                      <span className="h-1 w-1 opacity-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Activity Details Popover / Drawer for Selected Date */}
          {selectedDate && (
            <div className="mt-2 p-2.5 rounded-[6px] border-[1.5px] border-[#241A16]/30 space-y-1 text-xs bg-[#FFFBF7]">
              <div className="flex items-center justify-between border-b-[1.5px] border-[#241A16]/15 pb-1">
                <span className="font-bold text-[#241A16]">
                  {formatSelectedDate(selectedDate)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-[11px] text-[var(--ks-text-subtle)] hover:text-[#241A16] font-bold px-1 rounded-sm cursor-pointer"
                  aria-label="Close activity details"
                >
                  ✕
                </button>
              </div>

              {isSelectedDateActive || selectedDaySummary?.activity_count > 0 ? (
                <div className="space-y-0.5 pt-0.5">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#F16524]">
                    Learning Activity
                  </div>
                  {selectedDaySummary?.lessons_completed > 0 && (
                    <div className="flex items-center gap-1.5 text-emerald-800 text-[10.5px] font-medium">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>
                        {selectedDaySummary.lessons_completed}{' '}
                        {selectedDaySummary.lessons_completed === 1 ? 'lesson' : 'lessons'} completed
                      </span>
                    </div>
                  )}
                  {selectedDaySummary?.quizzes_completed > 0 && (
                    <div className="flex items-center gap-1.5 text-indigo-800 text-[10.5px] font-medium">
                      <CheckCircle2 className="h-3 w-3 text-indigo-600 shrink-0" />
                      <span>
                        {selectedDaySummary.quizzes_completed}{' '}
                        {selectedDaySummary.quizzes_completed === 1 ? 'quiz' : 'quizzes'} completed
                      </span>
                    </div>
                  )}
                  {selectedDaySummary?.games_completed > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-800 text-[10.5px] font-medium">
                      <CheckCircle2 className="h-3 w-3 text-amber-600 shrink-0" />
                      <span>
                        {selectedDaySummary.games_completed}{' '}
                        {selectedDaySummary.games_completed === 1 ? 'game' : 'games'} played
                      </span>
                    </div>
                  )}
                  {selectedDaySummary?.xp_earned > 0 && (
                    <div className="text-[10px] font-bold text-[#F16524] pt-0.5">
                      +{selectedDaySummary.xp_earned} XP earned
                    </div>
                  )}
                  {!selectedDaySummary && (
                    <div className="flex items-center gap-1.5 text-emerald-800 text-[10.5px] font-medium">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>Study streak activity recorded</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[10.5px] text-[var(--ks-text-muted)] italic pt-0.5">
                  No learning activity
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: XP Momentum Card - Secondary: No Hard Shadow */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('open-xp-modal'))}
        className="w-full p-2 rounded-[6px] border-[1.5px] border-[#241A16]/25 bg-white hover:border-[#241A16] hover:bg-[#FFF4EB] transition-all text-left flex items-center justify-between group cursor-pointer block"
        title="View XP & Rewards breakdown"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-[4px] border-[1.5px] border-[#241A16] bg-[#F16524] text-white text-xs shrink-0">
            <Zap className="h-3 w-3 fill-white" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#241A16]">
                {xp} Total XP
              </span>
              <span className="text-[10px] text-[#F16524] font-bold">
                • Lv {level}
              </span>
            </div>
            <p className="text-[10px] text-[var(--ks-text-muted)] mt-0.5 font-normal">
              {xpIntoLevel}/{xpRequired} XP ({progressPct}%) to Level {level + 1}
            </p>
          </div>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-[#F16524] group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  )
}
