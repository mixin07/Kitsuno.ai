import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Sparkles,
  Send,
  Trash2,
  User as UserIcon,
  Copy,
  Check,
  BookOpen,
  FileText,
  HelpCircle,
  BrainCircuit,
  ArrowRight,
  AlertCircle,
  Code2,
} from 'lucide-react'
import { sendAIChat } from '../../services/aiService.js'
import { getApiErrorMessage } from '../../services/api.js'

const SUGGESTED_PROMPTS = [
  { label: 'Explain this concept simply', icon: Sparkles },
  { label: 'Give me a code example', icon: Code2 },
  { label: 'Help me understand this error', icon: BrainCircuit },
  { label: 'Quiz me on what I learned', icon: HelpCircle },
  { label: "Explain it like I'm a beginner", icon: BookOpen },
  { label: 'Summarize key concepts', icon: FileText },
]

const SIDEBAR_ACTIONS = [
  { label: 'Explain a topic', prompt: 'Explain a core programming topic for me', icon: BookOpen },
  { label: 'Summarize lesson', prompt: 'Summarize my recent lesson key concepts', icon: FileText },
  { label: 'Create study notes', prompt: 'Generate structured study notes for revision', icon: Sparkles },
  { label: 'Quiz me', prompt: 'Quiz me on web development concepts with 3 questions', icon: HelpCircle },
  { label: 'Ask a doubt', prompt: 'I have a study doubt regarding code syntax', icon: BrainCircuit },
]

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore clipboard error
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg border-[1.5px] border-[#241A16] bg-[#1F1714] text-xs text-[#FAF5EE] font-mono shadow-[1px_2px_0_#241A16]">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.10)] bg-[#2A1F1B] px-3.5 py-1.5 text-[11px] font-mono">
        <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">
          {language || 'Code Snippet'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-[4px] border border-white/20 px-2 py-0.5 text-[10px] font-mono font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 sm:p-4 overflow-x-auto leading-relaxed text-[12px] sm:text-[13px] font-mono scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function renderInlineFormatted(str) {
  if (!str) return null

  // Split by inline code `...`
  const codeParts = str.split(/(`[^`]+`)/g)
  return codeParts.map((part, pIdx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const codeSnippet = part.slice(1, -1)
      return (
        <code
          key={pIdx}
          className="mx-0.5 px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-mono bg-[rgba(36,26,22,0.06)] border border-[rgba(36,26,22,0.10)] text-[#8F3215] font-semibold"
        >
          {codeSnippet}
        </code>
      )
    }

    // Split by bold **...**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
    return (
      <span key={pIdx}>
        {boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
            return (
              <strong key={bIdx} className="font-semibold text-[#241A16]">
                {bPart.slice(2, -2)}
              </strong>
            )
          }
          return bPart
        })}
      </span>
    )
  })
}

function FormattedMessage({ text }) {
  if (!text) return null

  // Split by code blocks ```...```
  const parts = text.split(/(```[\s\S]*?```)/g)
  return (
    <div className="space-y-2.5">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const firstLineEnd = part.indexOf('\n')
          const language = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() : ''
          const code = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3).trim() : part.slice(3, -3).trim()

          return <CodeBlock key={index} language={language} code={code} />
        }

        const lines = part.split('\n')
        return (
          <div key={index} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              if (!line.trim()) return <div key={lIdx} className="h-1" />

              // Check for bullet items
              if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                const bulletContent = line.trim().replace(/^[•\-*]\s*/, '')
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1 sm:pl-2">
                    <span className="text-[var(--ks-orange)] font-bold text-xs shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">{renderInlineFormatted(bulletContent)}</span>
                  </div>
                )
              }

              // Check for numbered items (e.g. "1. Step")
              const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/)
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1 sm:pl-2">
                    <span className="text-[var(--ks-orange)] font-bold text-xs shrink-0 mt-0.5">
                      {numMatch[1]}.
                    </span>
                    <span className="leading-relaxed">{renderInlineFormatted(numMatch[2])}</span>
                  </div>
                )
              }

              return (
                <p key={lIdx} className="leading-relaxed">
                  {renderInlineFormatted(line)}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default function AIChatPage() {
  const [searchParams] = useSearchParams()
  const lessonIdParam = searchParams.get('lessonId')
  const courseIdParam = searchParams.get('courseId')

  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastSentQuery, setLastSentQuery] = useState('')
  const [copiedIndex, setCopiedIndex] = useState(null)
  const chatBottomRef = useRef(null)
  const initialPromptHandled = useRef(false)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function handleSendMessage(textToSend) {
    const query = (textToSend || inputMessage).trim()
    if (!query || isLoading) return

    setLastSentQuery(query)
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
      setError(getApiErrorMessage(err) || 'Something went wrong while getting your answer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessageRef = useRef(handleSendMessage)
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage
  })

  // Handle URL query parameter ?prompt=... from Dashboard quick actions
  useEffect(() => {
    const promptParam = searchParams.get('prompt')
    if (promptParam && !initialPromptHandled.current) {
      initialPromptHandled.current = true
      handleSendMessageRef.current?.(promptParam)
    }
  }, [searchParams])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  function handleClearChat() {
    setMessages([])
    setError('')
    setLastSentQuery('')
  }

  const handleCopyAnswer = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="w-full space-y-5 md:space-y-6 pb-8">
      {/* 1. EDITORIAL PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-[1.5px] border-[#241A16]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="ks-eyebrow">
              KITSUNO AI
            </span>
            <span className="w-1.5 h-1.5 bg-[#F16524]" />
            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FFF2E6] text-[#F16524] border border-[#241A16]">
              {lessonIdParam ? 'Lesson Tutor Mode' : courseIdParam ? 'Course Mode' : 'General Study Mode'}
            </span>
          </div>

          <h1 className="ks-page-title">
            Ask Kitsuno
          </h1>

          <p className="ks-muted">
            Your AI study companion for learning, revision, and doubts.
          </p>
        </div>

        {messages.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClearChat}
              className="ks-neo-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:text-rose-600 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Chat</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. MAIN WORKSPACE: CHAT AREA + COMPACT STUDY SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PRIMARY CHAT CARD (8 Cols on Desktop, Full on Mobile) */}
        <div className="ks-neo-card lg:col-span-8 flex flex-col rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] bg-white overflow-hidden min-h-[520px]">
          {/* Subtle Status Strip when conversation is active */}
          {messages.length > 0 && (
            <div className="px-4 py-2 bg-[#FAF8F5] border-b-2 border-[#241A16] flex items-center justify-between text-[11px] font-mono text-neutral-500 shrink-0">
              <span className="font-medium text-[#241A16]">
                Active Study Session • {messages.length} message{messages.length === 1 ? '' : 's'}
              </span>
              <span className="flex items-center gap-1.5 text-[#F16524] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F16524] animate-pulse"></span>
                <span>Ready to answer</span>
              </span>
            </div>
          )}

          {/* NATURAL CONVERSATION STREAM — No wheel trapping */}
          <div className="flex-1 p-4 sm:p-5 space-y-4 bg-[#FAF8F5]/30 min-h-[360px]">
            {messages.length === 0 ? (
              /* ELEGANT EMPTY / WELCOME STATE */
              <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center p-4 sm:p-8 space-y-5 max-w-lg mx-auto">
                {/* Small Kitsuno AI Fox / Icon Element */}
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#FFF2E6] border-[1.5px] border-[#241A16] shadow-[1.5px_2px_0_#241A16] p-2.5">
                    <img
                      src="/logo.png"
                      alt="Kitsuno AI"
                      className="h-full w-full object-contain"
                      draggable="false"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md border border-[#241A16] bg-[#F16524] text-white shadow-xs">
                    <Sparkles className="h-3 w-3" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="ks-card-title text-xl sm:text-2xl font-normal text-[#241A16] tracking-tight">
                    What are you learning today?
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-md mx-auto">
                    Ask me anything about programming, your courses, lessons, or concepts you're studying. I'm here to clarify doubts, explain concepts, give code examples, and test your recall.
                  </p>
                </div>

                {/* SUGGESTED PROMPTS */}
                <div className="w-full space-y-2 pt-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block text-center">
                    Suggested Questions
                  </span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTED_PROMPTS.map((promptItem, idx) => {
                      const Icon = promptItem.icon
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(promptItem.label)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border-[1.5px] border-[rgba(36,26,22,0.18)] hover:border-[#241A16] hover:bg-[#FFF2E6] hover:shadow-[1px_1.5px_0_#241A16] bg-white text-xs font-medium text-[#241A16] transition-all cursor-pointer active:scale-98"
                        >
                          <Icon className="h-3.5 w-3.5 text-[#F16524] shrink-0" />
                          <span>{promptItem.label}</span>
                        </button>
                      )
                    })}
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
                      className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      {isUser ? (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-[1.5px] border-[#241A16] bg-[#F16524] text-white text-xs font-bold shadow-[1px_1px_0_#241A16]">
                          <UserIcon className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-[1.5px] border-[#241A16] bg-[#241A16] p-1 text-white shadow-[1px_1px_0_#241A16]">
                          <img
                            src="/logo.png"
                            alt="Kitsuno"
                            className="h-full w-full object-contain"
                            draggable="false"
                          />
                        </div>
                      )}

                      {/* Content Bubble */}
                      <div className={`max-w-[88%] sm:max-w-[80%] space-y-1 ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
                        {isUser ? (
                          <div className="rounded-lg rounded-tr-xs bg-[#FFF2E6] border-[1.5px] border-[#241A16] shadow-[1px_1.5px_0_#241A16] px-4 py-3 text-xs sm:text-sm text-[#241A16] font-medium text-left leading-relaxed">
                            {msg.content}
                          </div>
                        ) : (
                          <div className="rounded-lg rounded-tl-xs bg-white border-[1.5px] border-[#241A16] shadow-[1px_1.5px_0_#241A16] px-4 sm:px-5 py-4 text-xs sm:text-sm text-[#241A16]">
                            {(msg.lessonTitle || msg.courseTitle) && (
                              <div className="mb-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#FAF8F5] border border-[#241A16] text-[10px] font-mono font-bold uppercase text-[#241A16]">
                                <BookOpen className="h-3 w-3 shrink-0 text-[#F16524]" />
                                <span>{msg.courseTitle ? `${msg.courseTitle}${msg.lessonTitle ? ` • ${msg.lessonTitle}` : ''}` : msg.lessonTitle}</span>
                              </div>
                            )}

                            <FormattedMessage text={msg.content} />
                          </div>
                        )}

                        {/* Timestamp & Actions */}
                        <div className={`flex items-center gap-2 px-1 text-[10px] font-mono text-neutral-400 ${isUser ? 'justify-end' : 'justify-between'}`}>
                          {!isUser && (
                            <button
                              type="button"
                              onClick={() => handleCopyAnswer(msg.content, index)}
                              className="inline-flex items-center gap-1 hover:text-[#241A16] transition-colors cursor-pointer"
                            >
                              {copiedIndex === index ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-bold">Copied answer</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy answer</span>
                                </>
                              )}
                            </button>
                          )}
                          <span>
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* THINKING / LOADING STATE */}
                {isLoading && (
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-row">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-[1.5px] border-[#241A16] bg-[#241A16] p-1 text-white shadow-[1px_1px_0_#241A16]">
                      <img
                        src="/logo.png"
                        alt="Kitsuno"
                        className="h-full w-full object-contain"
                        draggable="false"
                      />
                    </div>
                    <div className="rounded-lg rounded-tl-xs bg-white border-[1.5px] border-[#241A16] shadow-[1px_1.5px_0_#241A16] px-4 py-3 text-xs sm:text-sm text-neutral-600 flex items-center gap-3">
                      <span className="flex h-2 w-2 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F16524] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F16524]"></span>
                      </span>
                      <span className="font-medium text-[#241A16]">Kitsuno is thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>
            )}
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mx-4 my-2 rounded-lg border-[1.5px] border-red-300 bg-red-50 px-4 py-2.5 text-xs text-red-800 flex items-center justify-between gap-3 shadow-[1px_1.5px_0_rgba(185,28,28,0.2)] shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSendMessage(lastSentQuery)}
                className="ks-neo-btn-primary px-2.5 py-1 text-xs font-bold shrink-0 cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* CHAT INPUT COMPOSER */}
          <div className="sticky bottom-0 bg-white border-t-2 border-[#241A16] p-3 sm:p-4 z-20 rounded-b-[7px] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="relative flex flex-col rounded-[6px] border-2 border-[#241A16] bg-white p-2 shadow-[2px_2px_0_#241A16] focus-within:border-[#F16524] transition-all"
            >
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about what you're learning..."
                rows={2}
                disabled={isLoading}
                className="w-full resize-none bg-transparent px-3 py-2 text-xs sm:text-sm text-[#241A16] placeholder-neutral-400 focus:outline-none min-h-[44px] max-h-36 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1 px-2 text-[11px] text-neutral-500 font-mono">
                <span className="hidden sm:inline">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">Shift + Enter</kbd> for new line
                </span>
                <span className="sm:hidden text-[10px]">
                  Tap send to ask Kitsuno
                </span>

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="ks-neo-btn-primary inline-flex h-9 px-3.5 shrink-0 items-center justify-center gap-1.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Send Message"
                >
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SECONDARY PANEL (Desktop only, 4 Cols) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col space-y-4 sticky top-6">
          {/* Companion Profile Card */}
          <div className="ks-neo-card p-5 space-y-3.5 rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] bg-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center shrink-0 rounded-md bg-[#FFF2E6] border-[1.5px] border-[#241A16] shadow-[1px_1px_0_#241A16] p-1.5">
                <img
                  src="/logo.png"
                  alt="Kitsuno Fox"
                  className="h-full w-full object-contain"
                  draggable="false"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">Online & Ready</span>
                </div>
                <h3 className="ks-neo-card-title leading-tight mt-0.5">
                  Kitsuno Study AI
                </h3>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Your 24/7 academic tutor. Ask for plain-English explanations, step-by-step code breakdowns, bug fixes, or quick practice checks.
            </p>

            <div className="pt-2 border-t border-[rgba(36,26,22,0.12)] flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-500 font-medium">Active Mode</span>
              <span className="font-bold text-[#F16524]">
                {lessonIdParam ? 'Lesson Tutor' : courseIdParam ? 'Course Mode' : 'General Study'}
              </span>
            </div>
          </div>

          {/* Quick Study Actions */}
          <div className="rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                QUICK STUDY ACTIONS
              </span>
              <Sparkles className="h-3.5 w-3.5 text-[#F16524]" />
            </div>

            <div className="space-y-1.5">
              {SIDEBAR_ACTIONS.map((action, idx) => {
                const Icon = action.icon
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(action.prompt)}
                    disabled={isLoading}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-md border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16] hover:bg-[#FFF2E6] transition-all text-xs font-semibold text-[#241A16] group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-[4px] border border-[#241A16] bg-[#FFF2E6] text-[#F16524] flex items-center justify-center shrink-0 group-hover:bg-[#F16524] group-hover:text-white transition-colors">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span>{action.label}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-[#F16524] group-hover:translate-x-0.5 transition-all" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Helpful Study Tips */}
          <div className="rounded-[8px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-4 text-xs space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 block">
              HOW TO ASK EFFECTIVELY
            </span>
            <ul className="space-y-1.5 text-[11px] text-neutral-600 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-[#F16524] font-bold">•</span>
                <span><strong>Be specific:</strong> Mention the programming language or concept.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#F16524] font-bold">•</span>
                <span><strong>Paste errors:</strong> Include compiler messages or unexpected output.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#F16524] font-bold">•</span>
                <span><strong>Practice:</strong> Ask "Quiz me on this" to test your recall.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
