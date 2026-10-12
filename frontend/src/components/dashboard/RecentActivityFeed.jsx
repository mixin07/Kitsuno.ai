import { Activity } from 'lucide-react'

const ACTIVITY_LABELS = Object.freeze({
  ENROLLED: 'Enrolled',
  LESSON_STARTED: 'Lesson started',
  LESSON_COMPLETED: 'Lesson completed',
  QUIZ_COMPLETED: 'Quiz completed',
  COURSE_COMPLETED: 'Course completed',
  AI_CHAT: 'AI Study Session',
})

export default function RecentActivityFeed({ analytics }) {
  const recentActivity = analytics?.recent_activity || []

  return (
    <div className="ks-neo-card-static p-4 sm:p-5 flex flex-col justify-between space-y-3 h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-[#241A16]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F16524]">
                LEARNING TIMELINE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F16524]" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Activity className="h-4 w-4 text-[#F16524]" />
              <h3 className="ks-card-title text-xl md:text-2xl font-serif text-[#241A16] font-normal leading-tight">
                Recent Activity
              </h3>
            </div>
          </div>
          <span className="text-[10.5px] font-bold text-[#241A16]/70">
            {recentActivity.length} event{recentActivity.length === 1 ? '' : 's'}
          </span>
        </div>

        {recentActivity.length > 0 ? (
          <div className="divide-y divide-[#241A16]/10 mt-1">
            {recentActivity.slice(0, 5).map((event, idx) => (
              <div key={idx} className="py-2 text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="rounded-[4px] bg-[#FFF2E6] px-1.5 py-0.5 text-[9px] font-bold text-[#8F3215] border border-[#241A16]/30">
                    {ACTIVITY_LABELS[event.event_type] || event.event_type}
                  </span>
                  <span className="text-[10px] font-mono text-[#241A16]/70">
                    {event.timestamp
                      ? new Date(event.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''}
                  </span>
                </div>
                <p className="font-normal text-[#241A16] leading-tight">{event.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-[#241A16]/70 border-[1.5px] border-[#241A16]/15 bg-[#FFFBF7] p-3 rounded-[6px] mt-2.5">
            <p className="font-medium text-[#241A16]">Your activity milestones will appear here as you study.</p>
          </div>
        )}
      </div>

      <div className="pt-2 border-t-[1.5px] border-[#241A16]/15 text-[11px] text-[#241A16]/70">
        <span className="font-normal">Automatically synchronized across all course lessons and quizzes</span>
      </div>
    </div>
  )
}
