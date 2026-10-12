import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { getWeeklyPlan } from '../../../services/studyPlanService.js'
import NeoTaskRow from '../../../components/NeoTaskRow.jsx'

function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatWeekRange(startStr, endStr) {
  if (!startStr || !endStr) return 'Weekly Schedule'
  const startDate = new Date(startStr + 'T00:00:00')
  const endDate = new Date(endStr + 'T00:00:00')
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  const year = endDate.getFullYear()

  if (startMonth === endMonth) {
    return `Week of ${startMonth} ${startDay} – ${endDay}, ${year}`
  }
  return `Week of ${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`
}

export default function WeeklyCalendarTab({ onTaskCompleted }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()))
  const [weeklyData, setWeeklyData] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completingTaskId, setCompletingTaskId] = useState(null)

  const weekStartStr = formatDateStr(currentWeekStart)
  const todayStr = formatDateStr(new Date())

  const fetchWeek = async (mondayDate) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getWeeklyPlan(formatDateStr(mondayDate))
      setWeeklyData(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load weekly schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeek(currentWeekStart)
  }, [weekStartStr, currentWeekStart])

  // Automatically select today if present in the displayed week, else first day of the week
  useEffect(() => {
    if (!weeklyData?.days || weeklyData.days.length === 0) return

    const hasToday = weeklyData.days.some((d) => d.date === todayStr)
    if (hasToday) {
      setSelectedDate(todayStr)
    } else {
      setSelectedDate(weeklyData.days[0].date)
    }
  }, [weeklyData, todayStr])

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart)
    prev.setDate(prev.getDate() - 7)
    setCurrentWeekStart(prev)
  }

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart)
    next.setDate(next.getDate() + 7)
    setCurrentWeekStart(next)
  }

  const handleToday = () => {
    setCurrentWeekStart(getMonday(new Date()))
  }

  const handleComplete = async (taskId) => {
    setCompletingTaskId(taskId)
    try {
      await onTaskCompleted(taskId)
      await fetchWeek(currentWeekStart)
    } finally {
      setCompletingTaskId(null)
    }
  }

  const days = weeklyData?.days || []
  const selectedDayObj = days.find((d) => d.date === selectedDate) || days[0] || null
  const selectedTasks = selectedDayObj?.tasks || []

  const selectedDateObj = selectedDayObj ? new Date(selectedDayObj.date + 'T00:00:00') : null
  const selectedDayName = selectedDateObj
    ? selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' })
    : ''
  const selectedFormattedDate = selectedDateObj
    ? selectedDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''
  const selectedTotalMinutes = selectedTasks.reduce(
    (sum, t) => sum + (t.estimated_minutes || 0),
    0
  )
  const selectedCompletedCount = selectedTasks.filter(
    (t) => t.status === 'COMPLETED'
  ).length

  return (
    <div className="space-y-6">
      {/* Week Navigator Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-[8px] border-2 border-[#241A16] bg-white shadow-[4px_4px_0_#241A16]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#FFF2E6] text-[#F16524] border-[1.5px] border-[#241A16] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0_#241A16]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F16524] block">
              WEEKLY SCHEDULE
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#241A16] mt-0.5">
              {weeklyData
                ? formatWeekRange(weeklyData.week_start, weeklyData.week_end)
                : 'Weekly Schedule'}
            </h2>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] font-mono text-xs font-bold uppercase shadow-[2px_2px_0_#241A16] hover:bg-[#FAF8F5] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            Current Week
          </button>
          <div className="flex items-center rounded-[6px] border-[1.5px] border-[#241A16] bg-white overflow-hidden shadow-[2px_2px_0_#241A16]">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-[#FAF5EE] text-[#241A16] transition-colors cursor-pointer"
              title="Previous Week"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1.5px] bg-[#241A16]" />
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-[#FAF5EE] text-[#241A16] transition-colors cursor-pointer"
              title="Next Week"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-[6px] bg-[#FFF2E6] border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] text-[#241A16] font-mono text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#F16524]" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#241A16]">
          <Loader2 className="w-8 h-8 animate-spin text-[#F16524] mb-3" />
          <p className="font-mono text-xs font-bold uppercase tracking-wider">Loading weekly schedule...</p>
        </div>
      ) : (
        <>
          {/* COMPACT WEEK CALENDAR (Day Selector) */}
          <div className="w-full max-w-full overflow-x-auto pb-1 scrollbar-thin">
            <div className="grid grid-cols-7 gap-2 sm:gap-3 min-w-[560px] sm:min-w-0">
              {days.map((day) => {
                const isSelected = day.date === selectedDate
                const isToday = day.date === todayStr
                const tasks = day.tasks || []
                const taskCount = tasks.length
                const allCompleted =
                  taskCount > 0 && tasks.every((t) => t.status === 'COMPLETED')
                const dayDate = new Date(day.date + 'T00:00:00')
                const dayAbbr = dayDate
                  .toLocaleDateString('en-US', { weekday: 'short' })
                  .toUpperCase()
                const dayNum = dayDate.getDate()

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className={`h-[88px] sm:h-[94px] p-2.5 rounded-[6px] border-[1.5px] text-center flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-2 border-[#241A16] bg-[#FFF2E6] text-[#241A16] shadow-[3px_3px_0_#241A16]'
                        : isToday
                        ? 'border-[1.5px] border-[#241A16] bg-[#FFFBF7] shadow-[2px_2px_0_#241A16] hover:bg-[#FAF8F5]'
                        : 'border-[1.5px] border-[#241A16] bg-white shadow-[2px_2px_0_#241A16] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {/* Day Name & Today Pill */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                          isSelected
                            ? 'text-[#F16524]'
                            : isToday
                            ? 'text-[#F16524]'
                            : 'text-neutral-500'
                        }`}
                      >
                        {dayAbbr}
                      </span>
                      {isToday && (
                        <span
                          className={`text-[8px] font-mono font-bold uppercase px-1 py-0.2 rounded-[3px] border border-[#241A16] ${
                            isSelected
                              ? 'bg-[#F16524] text-white'
                              : 'bg-[#FFF2E6] text-[#F16524]'
                          }`}
                        >
                          TODAY
                        </span>
                      )}
                    </div>

                    {/* Day Number */}
                    <div
                      className={`text-2xl font-serif font-normal leading-none ${
                        isSelected
                          ? 'text-[#F16524]'
                          : 'text-[#241A16]'
                      }`}
                    >
                      {dayNum}
                    </div>

                    {/* Task Indicators */}
                    <div className="h-4 flex items-center justify-center">
                      {taskCount > 0 ? (
                        allCompleted ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase text-[#241A16]">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Done</span>
                          </span>
                        ) : (
                          <span
                            className={`rounded-[3px] border border-[#241A16] px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${
                              isSelected
                                ? 'bg-white text-[#241A16]'
                                : 'bg-[#FAF8F5] text-[#241A16]'
                            }`}
                          >
                            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                          </span>
                        )
                      ) : (
                        <span className="font-mono text-[10px] text-neutral-400">
                          —
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SELECTED DAY SCHEDULE (Single Schedule Panel) */}
          <div className="rounded-[8px] border-2 border-[#241A16] bg-white shadow-[4px_4px_0_#241A16] overflow-hidden">
            {/* Panel Header */}
            <div className="p-4 sm:p-5 border-b-2 border-[#241A16] bg-[#FFFDF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F16524]">
                    {selectedDayName}
                  </span>
                  {selectedDayObj?.date === todayStr && (
                    <span className="rounded-[3px] border border-[#241A16] bg-[#F16524] text-white font-mono text-[9px] font-bold uppercase px-1.5 py-0.5">
                      TODAY
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#241A16] mt-0.5">
                  {selectedFormattedDate}
                </h3>
              </div>

              {selectedTasks.length > 0 && (
                <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs flex-wrap">
                  <div className="rounded-[4px] border border-[#241A16] bg-white px-2 py-1 text-[#241A16]">
                    <strong className="font-bold">
                      {selectedCompletedCount} / {selectedTasks.length}
                    </strong>{' '}
                    <span>COMPLETED</span>
                  </div>
                  <div className="rounded-[4px] border border-[#241A16] bg-[#FAF8F5] px-2 py-1 text-[#241A16] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#F16524]" />
                    <span>{selectedTotalMinutes} MIN TOTAL</span>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Body: Task Rows or Small Empty State */}
            <div className="p-4 sm:p-5">
              {selectedTasks.length === 0 ? (
                /* SMALL EMPTY STATE */
                <div className="py-10 px-4 text-center rounded-[6px] border-[1.5px] border-dashed border-[#241A16]/40 bg-[#FAF8F5] space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-[6px] border-[1.5px] border-[#241A16] bg-white shadow-[2px_2px_0_#241A16] text-[#241A16] flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#F16524]" />
                  </div>
                  <p className="font-serif text-base font-normal text-[#241A16]">
                    No study tasks scheduled
                  </p>
                  <p className="font-mono text-xs text-neutral-500">
                    Rest day • Nothing scheduled for this day.
                  </p>
                </div>
              ) : (
                /* Task Rows */
                <div className="space-y-2.5">
                  {selectedTasks.map((task) => (
                    <NeoTaskRow
                      key={task.id}
                      task={task}
                      onComplete={handleComplete}
                      completing={completingTaskId === task.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
