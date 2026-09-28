import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User as UserIcon,
  RefreshCw,
} from 'lucide-react'
import { sendAIChat } from '../../services/aiService.js'
import { getApiErrorMessage } from '../../services/api.js'

const SUGGESTED_PROMPTS = [
  'Explain this concept simply',
  'Give me an example',
  'Help me understand this error',
  'Quiz me on what I learned',
  "Explain it like I'm a beginner",
]

function renderFormattedText(text) {
  if (!text) return null

  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const firstLineEnd = part.indexOf('\n')
      const language = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() : ''
      const code = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3).trim() : part.slice(3, -3).trim()

      return (
        <div key={index} className="my-2.5 overflow-hidden rounded-lg border border-[var(--ks-border)] bg-[#1A1412] text-xs text-gray-100 font-mono">
          {language && (
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#241C18] px-3.5 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-sans">
              <span>{language}</span>
              <span className="text-gray-500">Code Snippet</span>
            </div>
          )}
          <pre className="p-3.5 overflow-x-auto leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      )
    }

    const lines = part.split('\n')
    return (
      <div key={index} className="space-y-1.5">
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <div key={lIdx} className="h-1.5" />
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-2">
                <span className="text-[var(--ks-orange)] font-bold text-xs shrink-0 mt-0.5">•</span>
                <span>{line.trim().replace(/^[•-]\s*/, '')}</span>
              </div>
            )
          }
          return <p key={lIdx} className="leading-relaxed">{line}</p>
        })}
      </div>
    )
  })
}

export default function AIChatPage() {
  const [searchParams] = useSearchParams()
  const lessonIdParam = searchParams.get('lessonId')
  const courseIdParam = searchParams.get('courseId')

  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const chatBottomRef = useRef(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function handleSendMessage(textToSend) {
    const query = (textToSend || inputMessage).trim()
    if (!query || isLoading) return

    const userMsg = { role: 'user', content: query, timestamp: new Date() }
    const updatedConversation = [...messages, userMsg]
    setMessages(updatedConversation)
    setInputMessage('')
    setIsLoading(true)
    setError('')

    try {
      const historyPayload = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const payload = {
        message: query,
        conversation: historyPayload,
        lesson_id: lessonIdParam ? Number(lessonIdParam) : null,
        course_id: courseIdParam ? Number(courseIdParam) : null,
      }

      const res = await sendAIChat(payload)
      const assistantMsg = {
        role: 'assistant',
        content: res.reply,
        courseTitle: res.course_title,
        lessonTitle: res.lesson_title,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Kitsuno couldn\'t respond right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  function handleClearChat() {
    setMessages([])
    setError('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto space-y-4">
      {/* 1. HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--ks-border)] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="ks-eyebrow">KITSUNO AI</span>
            <span className="rounded bg-[rgba(241,101,36,0.12)] px-2 py-0.5 text-[10px] font-bold text-[var(--ks-orange)] uppercase tracking-wider">
              {lessonIdParam ? 'Lesson Tutor Mode' : courseIdParam ? 'Course Mode' : 'General Study Mode'}
            </span>
          </div>
          <h1 className="ks-page-title mt-1">Ask Kitsuno</h1>
          <p className="text-xs text-[var(--ks-text-muted)]">
            Your AI study companion for learning, revision, and doubts.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ks-text-muted)] hover:border-red-300 hover:text-red-600 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* 2. CHAT CONVERSATION CONTAINER */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-4 sm:p-6 space-y-6 shadow-xs min-h-0">
        {messages.length === 0 ? (
          /* EMPTY STATE */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-lg mx-auto my-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(241,101,36,0.12)] text-[var(--ks-orange)] border border-[rgba(241,101,36,0.2)]">
              <Bot className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h2 className="ks-section-title text-lg">What are you learning today?</h2>
              <p className="text-xs text-[var(--ks-text-muted)] leading-relaxed">
                Ask me anything about programming, your courses, lessons, or concepts you're studying. I'm here to clarify doubts, give code examples, and test your recall.
              </p>
            </div>

            {/* SUGGESTED PROMPTS */}
            <div className="w-full space-y-2 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-text-subtle)] block text-left">
                Suggested Questions
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(promptText)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-3.5 py-2 text-xs font-medium text-[var(--ks-text)] hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)] transition text-left"
                  >
                    <Sparkles className="h-3 w-3 text-[var(--ks-orange)] shrink-0" />
                    <span>{promptText}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* MESSAGE THREAD */
          <div className="space-y-5">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isUser
                        ? 'bg-[var(--ks-orange)] text-white'
                        : 'bg-[#241A16] text-white border border-[var(--ks-border)]'
                    }`}
                  >
                    {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4 text-[var(--ks-orange)]" />}
                  </div>

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
                    <div
                      className={`rounded-xl px-4 py-3 text-xs shadow-xs ${
                        isUser
                          ? 'bg-[var(--ks-orange)] text-white font-medium rounded-tr-none'
                          : 'bg-[var(--ks-surface-soft)] border border-[var(--ks-border)] text-[var(--ks-text)] rounded-tl-none'
                      }`}
                    >
                      {renderFormattedText(msg.content)}
                    </div>

                    <span className="text-[10px] text-[var(--ks-text-subtle)] px-1 block">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex items-start gap-3 flex-row">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#241A16] text-white border border-[var(--ks-border)]">
                  <Bot className="h-4 w-4 text-[var(--ks-orange)] animate-pulse" />
                </div>
                <div className="rounded-xl rounded-tl-none border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-4 py-3 text-xs text-[var(--ks-text-muted)] flex items-center gap-2 shadow-xs">
                  <RefreshCw className="h-3.5 w-3.5 text-[var(--ks-orange)] animate-spin" />
                  <span>Kitsuno is thinking...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* 3. ERROR ALERT */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center justify-between shrink-0">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => handleSendMessage()}
            className="text-xs font-bold underline hover:no-underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. COMPOSER */}
      <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-2.5 sm:p-3 shadow-xs shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about what you're learning..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-xs text-[var(--ks-text)] placeholder-[var(--ks-text-subtle)] focus:outline-none max-h-32 min-h-[38px]"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ks-orange)] text-white transition hover:bg-[#E0520D] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send Message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
