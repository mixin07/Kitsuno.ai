import { useState } from 'react'
import { Sparkles, RefreshCw, BookOpen, CheckCircle2, Lightbulb } from 'lucide-react'
import { getLessonSummary } from '../../services/aiService.js'
import { getApiErrorMessage } from '../../services/api.js'

export default function AILessonSummary({ lessonId, lessonTitle }) {
  const [summaryData, setSummaryData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerateSummary() {
    setIsLoading(true)
    setError('')
    try {
      const data = await getLessonSummary(lessonId)
      setSummaryData(data)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Could not generate summary right now.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--ks-border)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--ks-orange)]" />
          <h3 className="ks-panel-title">AI Lesson Summary</h3>
        </div>

        {summaryData && (
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--ks-text-muted)] hover:text-[var(--ks-text)] hover:border-[var(--ks-orange)]/40 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[var(--ks-orange)] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        )}
      </div>

      {!summaryData && !isLoading && !error && (
        <div className="p-4 text-center space-y-3 border border-dashed border-[var(--ks-border)] rounded-lg bg-[var(--ks-surface-soft)]">
          <BookOpen className="mx-auto h-7 w-7 text-[var(--ks-text-subtle)]" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[var(--ks-text)]">
              Get an instant AI-powered summary of {lessonTitle}
            </p>
            <p className="text-[11px] text-[var(--ks-text-muted)]">
              Extract key concepts, structured explanations, and core takeaways.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateSummary}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ks-orange)] bg-[var(--ks-orange)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#E0520D]"
          >
            <Sparkles className="h-3.5 w-3.5 fill-white" />
            <span>Summarize Lesson</span>
          </button>
        </div>
      )}

      {isLoading && (
        <div className="py-8 text-center space-y-2">
          <RefreshCw className="mx-auto h-6 w-6 text-[var(--ks-orange)] animate-spin" />
          <p className="text-xs font-medium text-[var(--ks-text-muted)]">
            Analyzing lesson context and generating summary...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleGenerateSummary}
            className="text-xs font-bold underline hover:no-underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {summaryData && !isLoading && (
        <div className="space-y-4 text-xs">
          {/* Quick Summary */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-orange)] block">
              Quick Summary
            </span>
            <p className="leading-relaxed text-[var(--ks-text)] bg-[var(--ks-surface-soft)] p-3 rounded.lg border border-[var(--ks-border)]/60">
              {summaryData.summary}
            </p>
          </div>

          {/* Key Concepts */}
          {summaryData.key_concepts && summaryData.key_concepts.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] block">
                Key Concepts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {summaryData.key_concepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded border border-[var(--ks-border)] bg-[var(--ks-surface-soft)]"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-[var(--ks-orange)] shrink-0 mt-0.5" />
                    <span className="text-[11.5px] font-medium text-[var(--ks-text)]">{concept}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remember / Takeaways */}
          {summaryData.takeaways && summaryData.takeaways.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] block">
                Remember
              </span>
              <div className="space-y-1.5">
                {summaryData.takeaways.map((takeaway, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-[var(--ks-text-muted)] leading-relaxed">{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
