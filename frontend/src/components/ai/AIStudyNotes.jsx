import { useEffect, useState } from 'react'
import {
  FileText,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Download,
  Bookmark,
  BookmarkCheck,
  Code2,
  ListOrdered,
  Lightbulb,
} from 'lucide-react'
import { getLessonNotes } from '../../services/aiService.js'
import { getSavedNote, saveNote, unsaveNote } from '../../services/savedService.js'
import { getApiErrorMessage } from '../../services/api.js'
import { generateStudyNotesPDF } from '../../utils/pdfGenerator.js'

export default function AIStudyNotes({ lessonId, lessonTitle, courseId, courseTitle }) {
  const [notesData, setNotesData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Load existing saved notes on mount if available
  useEffect(() => {
    let active = true

    async function checkSaved() {
      if (!lessonId) return
      try {
        const saved = await getSavedNote(lessonId)
        if (!active) return
        if (saved && saved.content) {
          setNotesData(saved.content)
          setIsSaved(true)
        }
      } catch {
        // silent fallback
      }
    }

    checkSaved()
    return () => {
      active = false
    }
  }, [lessonId])

  async function handleGenerateNotes() {
    setIsLoading(true)
    setError('')
    try {
      const data = await getLessonNotes(lessonId)
      setNotesData(data)
      // Note: Regeneration gives a fresh preview without automatically changing saved state
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Could not generate study notes right now.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggleSaveNotes() {
    if (!notesData) return
    setIsSaving(true)
    try {
      if (isSaved) {
        await unsaveNote(lessonId)
        setIsSaved(false)
      } else {
        await saveNote({
          lesson_id: lessonId,
          course_id: courseId || 1,
          topic: notesData.topic || lessonTitle,
          content: notesData,
        })
        setIsSaved(true)
      }
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to save notes.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleCopyNotes() {
    if (!notesData) return
    const sections = []

    sections.push(`# ${notesData.topic || lessonTitle} — AI Study Notes`)
    if (courseTitle) sections.push(`Course: ${courseTitle}`)
    sections.push('')

    if (notesData.topic_overview) {
      sections.push('## 1. TOPIC OVERVIEW')
      sections.push(notesData.topic_overview)
      sections.push('')
    }

    if (notesData.core_concepts?.length) {
      sections.push('## 2. KEY CONCEPTS')
      notesData.core_concepts.forEach((c) => sections.push(`- ${c}`))
      sections.push('')
    }

    if (notesData.definitions?.length) {
      sections.push('## 3. IMPORTANT DEFINITIONS')
      notesData.definitions.forEach((d) => sections.push(`- ${d}`))
      sections.push('')
    }

    if (notesData.syntax_rules?.length) {
      sections.push('## 4. CORE SYNTAX & RULES')
      notesData.syntax_rules.forEach((r, idx) => sections.push(`${idx + 1}. ${r}`))
      sections.push('')
    }

    if (notesData.examples?.length) {
      sections.push('## 5. PRACTICAL EXAMPLES')
      notesData.examples.forEach((ex) => sections.push(`\`\`\`\n${ex}\n\`\`\``))
      sections.push('')
    }

    if (notesData.step_by_step?.length) {
      sections.push('## 6. STEP-BY-STEP EXPLANATION')
      notesData.step_by_step.forEach((s) => sections.push(s))
      sections.push('')
    }

    if (notesData.common_mistakes?.length) {
      sections.push('## 7. COMMON MISTAKES TO AVOID')
      notesData.common_mistakes.forEach((m) => sections.push(`! ${m}`))
      sections.push('')
    }

    if (notesData.important_points?.length) {
      sections.push('## 8. IMPORTANT POINTS TO REMEMBER')
      notesData.important_points.forEach((p) => sections.push(`* ${p}`))
      sections.push('')
    }

    if (notesData.quick_revision?.length) {
      sections.push('## 9. QUICK REVISION CHECKLIST')
      notesData.quick_revision.forEach((r) => sections.push(`[x] ${r}`))
      sections.push('')
    }

    navigator.clipboard.writeText(sections.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadPDF() {
    generateStudyNotesPDF({
      courseTitle: courseTitle || 'Kitsuno Course',
      lessonTitle: lessonTitle || notesData?.topic || 'Lesson',
      notesData,
    })
  }

  return (
    <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 md:p-7 space-y-6 shadow-xs">
      {/* 1. NOTEBOOK ACTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--ks-border)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--ks-text)] tracking-tight">
              AI Study Notes Notebook
            </h3>
            <p className="text-xs text-[var(--ks-text-muted)]">
              Comprehensive revision material generated from this curriculum lesson
            </p>
          </div>
        </div>

        {notesData && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Notes Button */}
            <button
              type="button"
              onClick={handleCopyNotes}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ks-text)] hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)] transition shadow-2xs"
              title="Copy markdown notes to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">✓ Notes Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[var(--ks-text-muted)]" />
                  <span>Copy Notes</span>
                </>
              )}
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ks-text)] hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)] transition shadow-2xs"
              title="Download formatted revision PDF"
            >
              <Download className="h-3.5 w-3.5 text-[var(--ks-orange)]" />
              <span>Download PDF</span>
            </button>

            {/* Save Notes Button */}
            <button
              type="button"
              onClick={handleToggleSaveNotes}
              disabled={isSaving}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
                isSaved
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
                  : 'border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text)] hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)]'
              }`}
              title={isSaved ? 'Saved to profile — click to remove' : 'Save notes to your profile'}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>✓ Notes Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5 text-[var(--ks-text-muted)]" />
                  <span>Save Notes</span>
                </>
              )}
            </button>

            {/* Regenerate Button */}
            <button
              type="button"
              onClick={handleGenerateNotes}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--ks-text-muted)] hover:text-[var(--ks-text)] hover:border-[var(--ks-orange)]/40 transition disabled:opacity-50"
              title="Generate a fresh version without removing saved notes"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[var(--ks-orange)] ${isLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate Notes</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. EMPTY STATE: PROMPT TO GENERATE */}
      {!notesData && !isLoading && !error && (
        <div className="p-8 text-center space-y-4 border border-dashed border-[var(--ks-border)] rounded-xl bg-[var(--ks-surface-soft)] max-w-xl mx-auto my-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[rgba(241,101,36,0.1)] flex items-center justify-center text-[var(--ks-orange)]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-[var(--ks-text)]">
              Generate Structured Study Notebook for "{lessonTitle}"
            </h4>
            <p className="text-xs text-[var(--ks-text-muted)] leading-relaxed">
              Create comprehensive revision material including core principles, important definitions, code examples, step-by-step guides, common mistakes, and quick revision takeaways.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateNotes}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--ks-orange)] bg-[var(--ks-orange)] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#E0520D] shadow-xs"
          >
            <Sparkles className="h-4 w-4 fill-white" />
            <span>Generate Study Notes</span>
          </button>
        </div>
      )}

      {/* 3. LOADING STATE */}
      {isLoading && (
        <div className="py-12 text-center space-y-3">
          <RefreshCw className="mx-auto h-7 w-7 text-[var(--ks-orange)] animate-spin" />
          <p className="text-sm font-semibold text-[var(--ks-text)]">
            Synthesizing Comprehensive Study Notebook...
          </p>
          <p className="text-xs text-[var(--ks-text-muted)] max-w-sm mx-auto">
            Extracting definitions, core syntax rules, code examples, and revision takeaways.
          </p>
        </div>
      )}

      {/* 4. ERROR MESSAGE */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleGenerateNotes}
            className="text-xs font-bold underline hover:no-underline ml-3 shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 5. STRUCTURED DIGITAL STUDY NOTEBOOK */}
      {notesData && !isLoading && (
        <div className="space-y-7 text-[13.5px] leading-relaxed max-w-4xl mx-auto">
          {/* Note Banner Header */}
          <div className="bg-[rgba(241,101,36,0.05)] border border-[rgba(241,101,36,0.2)] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ks-orange)] block">
                STUDY TOPIC
              </span>
              <h4 className="text-lg font-bold text-[var(--ks-text)] font-serif mt-0.5">
                {notesData.topic || lessonTitle}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--ks-text-muted)]">
              {isSaved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-500/30">
                  <BookmarkCheck className="h-3 w-3" /> Saved in library
                </span>
              )}
            </div>
          </div>

          {/* Section 1: Topic Overview */}
          {notesData.topic_overview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ks-orange)] text-[10px] font-bold text-white">
                  1
                </span>
                <h5 className="font-bold text-sm text-[var(--ks-text)] uppercase tracking-wider">
                  Topic Overview
                </h5>
              </div>
              <p className="text-[var(--ks-text-muted)] pl-7 leading-relaxed bg-[var(--ks-surface-soft)]/60 p-3.5 rounded-lg border border-[var(--ks-border)]/60">
                {notesData.topic_overview}
              </p>
            </div>
          )}

          {/* Section 2: Key Concepts */}
          {notesData.core_concepts && notesData.core_concepts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ks-orange)] text-[10px] font-bold text-white">
                  2
                </span>
                <h5 className="font-bold text-sm text-[var(--ks-text)] uppercase tracking-wider">
                  Key Concepts
                </h5>
              </div>
              <ul className="pl-7 space-y-2">
                {notesData.core_concepts.map((concept, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[var(--ks-text)]">
                    <span className="text-[var(--ks-orange)] font-bold text-base leading-none mt-0.5">•</span>
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 3: Important Definitions */}
          {notesData.definitions && notesData.definitions.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ks-orange)] text-[10px] font-bold text-white">
                  3
                </span>
                <h5 className="font-bold text-sm text-[var(--ks-text)] uppercase tracking-wider">
                  Important Definitions
                </h5>
              </div>
              <div className="pl-7 space-y-2">
                {notesData.definitions.map((def, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] text-[12.5px] leading-relaxed text-[var(--ks-text)] font-medium"
                  >
                    {def}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Core Syntax / Rules */}
          {notesData.syntax_rules && notesData.syntax_rules.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ks-orange)] text-[10px] font-bold text-white">
                  4
                </span>
                <h5 className="font-bold text-sm text-[var(--ks-text)] uppercase tracking-wider">
                  Core Syntax & Rules
                </h5>
              </div>
              <ol className="pl-7 space-y-2">
                {notesData.syntax_rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[var(--ks-text)]">
                    <span className="font-mono text-xs font-bold text-[var(--ks-orange)] shrink-0 mt-0.5">
                      [{idx + 1}]
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Section 5: Practical Examples */}
          {notesData.examples && notesData.examples.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ks-orange)] text-[10px] font-bold text-white">
                  5
                </span>
                <h5 className="font-bold text-sm text-[var(--ks-text)] uppercase tracking-wider flex items-center gap-2">
                  <span>Practical Code Examples</span>
                  <Code2 className="h-4 w-4 text-[var(--ks-text-muted)]" />
                </h5>
              </div>
              <div className="pl-7 space-y-3">
                {notesData.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-xl border border-[var(--ks-border)] bg-[#181210] p-4 font-mono text-xs text-amber-50/90 shadow-xs"
                  >
                    <pre className="overflow-x-auto leading-relaxed">
                      <code>{ex}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Step-by-Step Explanation */}
          {notesData.step_by_step && notesData.step_by_step.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ks-orange)] text-[10px] font-bold text-white">
                  6
                </span>
                <h5 className="font-bold text-sm text-[var(--ks-text)] uppercase tracking-wider flex items-center gap-1.5">
                  <span>Step-by-Step Explanation</span>
                  <ListOrdered className="h-4 w-4 text-[var(--ks-text-muted)]" />
                </h5>
              </div>
              <div className="pl-7 space-y-2">
                {notesData.step_by_step.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text)] text-xs flex items-start gap-2.5"
                  >
                    <span className="font-bold text-[var(--ks-orange)] shrink-0">Step {idx + 1}:</span>
                    <span>{step.replace(/^Step\s*\d+:\s*/i, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 7: Common Mistakes to Avoid */}
          {notesData.common_mistakes && notesData.common_mistakes.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  7
                </span>
                <h5 className="font-bold text-sm text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Common Mistakes to Avoid</span>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </h5>
              </div>
              <div className="pl-7 space-y-2">
                {notesData.common_mistakes.map((mistake, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-red-800 bg-red-500/5 p-3 rounded-lg border border-red-200"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                    <span className="leading-relaxed">{mistake}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 8: Important Points to Remember */}
          {notesData.important_points && notesData.important_points.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ks-orange)] text-[10px] font-bold text-white">
                  8
                </span>
                <h5 className="font-bold text-sm text-[var(--ks-text)] uppercase tracking-wider flex items-center gap-1.5">
                  <span>Important Points to Remember</span>
                  <Lightbulb className="h-4 w-4 text-[var(--ks-orange)]" />
                </h5>
              </div>
              <ul className="pl-7 space-y-2">
                {notesData.important_points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-[var(--ks-text)]">
                    <span className="text-[var(--ks-orange)] font-bold shrink-0 mt-0.5">★</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 9: Quick Revision Checklist */}
          {notesData.quick_revision && notesData.quick_revision.length > 0 && (
            <div className="space-y-2.5 pt-4 border-t border-[var(--ks-border)]">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  9
                </span>
                <h5 className="font-bold text-sm text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Quick Revision Checklist</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </h5>
              </div>
              <div className="pl-7 space-y-2">
                {notesData.quick_revision.map((rev, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-emerald-900 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span className="leading-relaxed">{rev}</span>
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
