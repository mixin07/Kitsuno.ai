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
    <div className="rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--ks-border)]">
        <h3 className="ks-panel-title font-serif text-base">
          Recent Activity
        </h3>
        <Activity className="h-4 w-4 text-[var(--ks-text-subtle)]" />
      </div>

      {recentActivity.length > 0 ? (
        <div className="divide-y divide-[var(--ks-border)]">
          {recentActivity.slice(0, 5).map((event, idx) => (
            <div key={idx} className="py-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="rounded bg-[var(--ks-orange)]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--ks-orange)]">
                  {ACTIVITY_LABELS[event.event_type] || event.event_type}
                </span>
                <span className="text-[10px] text-[var(--ks-text-subtle)]">
                  {event.timestamp
                    ? new Date(event.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </span>
              </div>
              <p className="font-medium text-[var(--ks-text)] leading-tight">{event.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-[var(--ks-text-muted)] border border-dashed border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3 rounded">
          <p className="font-medium text-[var(--ks-text)]">Your activity will appear here as you learn.</p>
        </div>
      )}
    </div>
  )
}
