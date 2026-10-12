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
    <div className="ks-neo-card-static p-4 sm:p-5 flex flex-col justify-between space-y-3 h-full relative overflow-hidden">
      <div>
        <div className="flex items-start justify-between gap-3 pb-3 border-b-[1.5px] border-[#241A16]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center shrink-0 rounded-[6px] bg-[#FFF2E6] border-[1.5px] border-[#241A16] p-1.5">
              <img
                src="/logo.png"
                alt="Kitsuno AI"
                className="h-full w-full object-contain"
                draggable="false"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F16524]">
                  24/7 STUDY TUTOR
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F16524]" />
              </div>
              <h3 className="ks-card-title text-xl md:text-2xl font-serif text-[#241A16] font-normal leading-tight mt-0.5">
                Kitsuno AI
              </h3>
            </div>
          </div>

          <Link
            to="/ai-chat"
            className="text-xs font-bold text-[#F16524] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Open Chat</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <p className="mt-2.5 text-xs text-[var(--ks-text-muted)] leading-relaxed font-normal">
          Your personal study companion. Ask code syntax questions, generate concise lesson summaries, or clarify difficult concepts anytime.
        </p>
      </div>

      <div className="space-y-1.5 pt-0.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8F3215] block">
          QUICK PROMPT ACTIONS
        </span>

        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((action, idx) => {
            const Icon = action.icon
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleActionClick(action.prompt)}
                className="inline-flex items-center gap-1.5 rounded-[6px] border-[1.5px] border-[#241A16]/25 bg-white px-2.5 py-1 text-xs font-semibold text-[#241A16] hover:border-[#241A16] hover:bg-[#FFF4EB] transition-all cursor-pointer"
              >
                <Icon className="h-3.5 w-3.5 text-[#F16524]" />
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
