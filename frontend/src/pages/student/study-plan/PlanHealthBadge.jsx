import { CheckCircle2, TrendingUp, AlertTriangle, Sparkles, Clock } from 'lucide-react'

export default function PlanHealthBadge({ status, health, className = '' }) {
  // If plan status is COMPLETED or PAUSED, show that; otherwise use health
  const effectiveHealth = status === 'COMPLETED' ? 'COMPLETED' : health || 'ON_TRACK'

  const configs = {
    AHEAD: {
      label: 'Ahead of Pace',
      icon: Sparkles,
      bg: 'bg-sky-50 text-sky-900 border-[#241A16]',
      dot: 'bg-sky-600',
    },
    ON_TRACK: {
      label: 'On Track',
      icon: TrendingUp,
      bg: 'bg-emerald-50 text-emerald-900 border-[#241A16]',
      dot: 'bg-emerald-600',
    },
    AT_RISK: {
      label: 'At Risk',
      icon: AlertTriangle,
      bg: 'bg-amber-50 text-amber-950 border-[#241A16]',
      dot: 'bg-amber-600',
    },
    COMPLETED: {
      label: 'Completed',
      icon: CheckCircle2,
      bg: 'bg-[#FAF8F5] text-neutral-800 border-[#241A16]',
      dot: 'bg-emerald-600',
    },
    PAUSED: {
      label: 'Paused',
      icon: Clock,
      bg: 'bg-stone-50 text-stone-800 border-[#241A16]',
      dot: 'bg-stone-400',
    },
  }

  const config = configs[effectiveHealth] || configs.ON_TRACK
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider border-[1.5px] ${config.bg} ${className}`}
      title={`Plan status: ${config.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className="w-3 h-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  )
}
