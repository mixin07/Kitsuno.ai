import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, BrainCircuit, BookOpen, FileText, HelpCircle, ArrowRight } from 'lucide-react'

export default function AIStudyCompanionCard() {
  const navigate = useNavigate()

  const quickActions = [
    { label: 'Explain a topic', prompt: 'Explain a core programming topic for me', icon: BookOpen },
    { label: 'Summarize lesson', prompt: 'Summarize my recent lesson key concepts', icon: FileText },
    { label: 'Create study notes', prompt: 'Generate structured study notes for revision', icon: Sparkles },
    { label: 'Quiz me', prompt: 'Quiz me on web development concepts with 3 questions', icon: HelpCircle },
    { label: 'Ask a doubt', prompt: 'I have a study doubt regarding code syntax', icon: BrainCircuit },
  ]

  const handleActionClick = (prompt) => {
    navigate(`/ai/chat?prompt=${encodeURIComponent(prompt)}`)
  }

  return (
    <div className="rounded-lg border border-[var(--ks-orange)]/30 bg-gradient-to-br from-[var(--ks-surface)] to-[var(--ks-surface-soft)] p-5 space-y-4 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ks-border)]">
        <div className="flex items-center gap-3">
          <div className="flex h-13 w-12 sm:h-14 sm:w-13 items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="Kitsuno AI"
              className="h-full w-full object-contain"
              draggable="false"
            />
          </div>
          <div>
            <h3 className="font-semibold text-base text-[var(--ks-text)] leading-snug">
              Kitsuno AI
            </h3>
            <p className="text-xs text-[var(--ks-text-muted)] mt-0.5">
              Your personal study companion.
            </p>
          </div>
        </div>

        <Link
          to="/ai/chat"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--ks-orange)] hover:underline shrink-0"
        >
          <span>Open AI Chat</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] block">
          QUICK AI ASSISTANT ACTIONS
        </span>

        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, idx) => {
            const Icon = action.icon
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleActionClick(action.prompt)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] transition-all hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)] hover:shadow-2xs active:scale-98"
              >
                <Icon className="h-3 w-3 text-[var(--ks-orange)]" />
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
