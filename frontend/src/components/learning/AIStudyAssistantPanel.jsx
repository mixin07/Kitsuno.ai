import { useState } from 'react'
import { Sparkles, Send, RefreshCw, HelpCircle, BookOpen, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react'
import { askStudyAssistant } from '../../services/aiService.js'
import { getApiErrorMessage } from '../../services/api.js'

export default function AIStudyAssistantPanel({ lessonId, lessonTitle, _moduleTitle }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend(action = 'CHAT', customText = null) {
    const textToSend = customText !== null ? customText : inputMessage.trim()
    if (action === 'CHAT' && !textToSend) return

    setError('')
    setIsLoading(true)

    // Add user message to UI thread if user typed something or picked a quick action
    let userDisplayMessage = textToSend
    if (action === 'EXPLAIN') userDisplayMessage = '💡 Explain this lesson in simple terms'
    else if (action === 'SUMMARIZE') userDisplayMessage = '📝 Summarize key takeaways of this lesson'
    else if (action === 'EXAMPLE') userDisplayMessage = '💻 Give me a practical code example'
    else if (action === 'QUIZ_ME') userDisplayMessage = '🎯 Quiz me with a practice question'

    const newUserMsg = { role: 'user', content: userDisplayMessage }
    const updatedMessages = [...messages, newUserMsg]
    setMessages(updatedMessages)
    if (customText === null) setInputMessage('')

    // Build chat history array for API (max last 6 messages)
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const response = await askStudyAssistant({
        lesson_id: Number(lessonId),
        action,
        message: textToSend || null,
        chat_history: historyPayload,
      })

      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply }])
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setMessages([])
    setError('')
  }

  return (
    <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ks-border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(241,101,36,0.12)] text-[var(--ks-orange)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="ks-panel-title text-sm font-bold text-[var(--ks-text)]">
                AI STUDY ASSISTANT
              </h3>
              <span className="rounded-full bg-[rgba(241,101,36,0.08)] border border-[var(--ks-orange)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--ks-orange)] uppercase">
                Lesson Context
              </span>
            </div>
            <p className="text-xs text-[var(--ks-text-muted)]">
              Ask anything or use quick actions to master <span className="font-semibold text-[var(--ks-text)]">{lessonTitle}</span>
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ks-text-muted)] hover:text-[var(--ks-text)] transition disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset Chat</span>
          </button>
        )}
      </div>

      {/* Quick Actions Bar */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)]">
          Quick Actions
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSend('EXPLAIN')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] transition hover:border-[var(--ks-orange)]/50 hover:bg-[rgba(241,101,36,0.06)] hover:text-[var(--ks-orange)] disabled:opacity-50"
          >
            <Lightbulb className="h-3.5 w-3.5 text-[var(--ks-orange)]" />
            <span>Explain this lesson</span>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSend('SUMMARIZE')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] transition hover:border-[var(--ks-orange)]/50 hover:bg-[rgba(241,101,36,0.06)] hover:text-[var(--ks-orange)] disabled:opacity-50"
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-500" />
            <span>Summarize</span>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSend('EXAMPLE')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] transition hover:border-[var(--ks-orange)]/50 hover:bg-[rgba(241,101,36,0.06)] hover:text-[var(--ks-orange)] disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Give me an example</span>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSend('QUIZ_ME')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text)] transition hover:border-[var(--ks-orange)]/50 hover:bg-[rgba(241,101,36,0.06)] hover:text-[var(--ks-orange)] disabled:opacity-50"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
            <span>Quiz me</span>
          </button>
        </div>
      </div>

      {/* Message Thread */}
      {messages.length > 0 && (
        <div className="max-h-80 overflow-y-auto space-y-3 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] p-3 text-xs">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ks-orange)] text-white text-[10px] font-bold mt-0.5">
                  AI
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[var(--ks-orange)] text-white font-medium rounded-tr-none shadow-xs'
                    : 'bg-[var(--ks-surface)] text-[var(--ks-text)] border border-[var(--ks-border)] rounded-tl-none shadow-xs'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-[var(--ks-text-muted)] text-xs font-medium pl-1">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-[var(--ks-orange)]" />
              <span>AI is thinking about this lesson...</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend('CHAT')
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask anything about this lesson..."
          disabled={isLoading}
          className="flex-1 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3.5 py-2 text-xs text-[var(--ks-text)] placeholder-[var(--ks-text-muted)] focus:border-[var(--ks-orange)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ks-orange)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--ks-orange-light)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>Ask AI</span>
          <Send className="h-3 w-3" />
        </button>
      </form>
    </div>
  )
}
