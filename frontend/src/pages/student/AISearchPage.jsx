import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search,
  Sparkles,
  BookOpen,
  Layers,
  FileText,
  ClipboardCheck,
  ArrowRight,
  X,
  Filter,
  Flame,
} from 'lucide-react'
import { searchLibrary } from '../../services/searchService.js'
import { getApiErrorMessage } from '../../services/api.js'

const QUICK_CHIPS = [
  'javascript async await',
  'React state management',
  'beginner Python lessons',
  'CSS flexbox',
  'Java collections',
  'MongoDB queries',
]

const TYPE_CONFIG = {
  COURSE: {
    label: 'Course',
    icon: BookOpen,
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  MODULE: {
    label: 'Module',
    icon: Layers,
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  LESSON: {
    label: 'Lesson',
    icon: FileText,
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  QUIZ: {
    label: 'Quiz',
    icon: ClipboardCheck,
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
  },
}

export default function AISearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const urlQuery = searchParams.get('q') || ''
  const [inputValue, setInputValue] = useState(urlQuery)
  const [activeQuery, setActiveQuery] = useState(urlQuery)
  const [searchResult, setSearchResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  // Execute search
  const performSearch = useCallback(async (queryText) => {
    const trimmed = queryText.trim()
    if (!trimmed) {
      setSearchResult(null)
      setError('')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const data = await searchLibrary(trimmed)
      setSearchResult(data)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setSearchResult(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sync with URL ?q= parameter on mount and when changed externally
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setInputValue(q)
    setActiveQuery(q)
    if (q.trim()) {
      performSearch(q)
    } else {
      setSearchResult(null)
    }
  }, [searchParams, performSearch])

  const handleFormSubmit = (e) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setSearchParams({})
      return
    }
    setSearchParams({ q: trimmed })
  }

  const handleChipClick = (chipText) => {
    setInputValue(chipText)
    setSearchParams({ q: chipText })
  }

  const handleClear = () => {
    setInputValue('')
    setActiveQuery('')
    setSearchResult(null)
    setError('')
    setSearchParams({})
  }

  // Filtered results
  const filteredResults = useMemo(() => {
    if (!searchResult?.results) return []
    if (typeFilter === 'ALL') return searchResult.results
    return searchResult.results.filter((item) => item.content_type === typeFilter)
  }, [searchResult, typeFilter])

  // Count by content type
  const counts = useMemo(() => {
    const map = { ALL: 0, COURSE: 0, MODULE: 0, LESSON: 0, QUIZ: 0 }
    if (!searchResult?.results) return map
    map.ALL = searchResult.results.length
    searchResult.results.forEach((item) => {
      if (map[item.content_type] !== undefined) {
        map[item.content_type] += 1
      }
    })
    return map
  }, [searchResult])

  return (
    <div className="space-y-5 md:space-y-6 w-full pb-8">
      {/* 1. EDITORIAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-[1.5px] border-[#241A16]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="ks-eyebrow">
              DISCOVERY &amp; RETRIEVAL
            </span>
            <span className="w-1.5 h-1.5 bg-[#F16524]" />
            <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#FFF2E6] border border-[#241A16] px-2 py-0.5 text-[10px] font-mono font-bold text-[#F16524] uppercase shadow-[1px_1px_0_#241A16]">
              <Sparkles className="h-3 w-3" />
              AI Powered
            </span>
          </div>

          <h1 className="ks-page-title">
            AI Search
          </h1>

          <p className="ks-muted">
            Find courses, lessons, modules, and quizzes across the entire library using natural language or keywords.
          </p>
        </div>
      </div>

      {/* 2. SEARCH BAR & QUICK CHIPS */}
      <div className="ks-neo-card rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] bg-white p-4 sm:p-5 space-y-4">
        <form onSubmit={handleFormSubmit} className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search courses, lessons, quizzes, or concepts (e.g. 'how does css grid work')..."
            className="w-full h-11 pl-12 pr-28 rounded-[6px] border-2 border-[#241A16] bg-white text-sm text-[#241A16] placeholder-neutral-400 focus:outline-none focus:border-[#F16524] transition-all"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-neutral-400 hover:text-[#241A16] rounded-md transition-colors cursor-pointer"
                title="Clear query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="ks-neo-btn-primary px-4 py-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Quick query chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[#241A16] font-mono text-[11px] font-bold flex items-center gap-1 uppercase tracking-wider">
            <Flame className="h-3.5 w-3.5 text-[#F16524]" />
            Popular:
          </span>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="px-2.5 py-1 rounded-[4px] bg-[#FAF8F5] border-[1.5px] border-[#241A16] shadow-[1px_1px_0_#241A16] text-[#241A16] hover:bg-[#FFF2E6] hover:text-[#F16524] transition-all cursor-pointer font-semibold text-xs active:translate-x-[0.5px] active:translate-y-[0.5px]"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ERROR ALERT */}
      {error && (
        <div className="rounded-lg border-[1.5px] border-red-300 bg-red-50 p-4 text-xs text-red-800 shadow-[1px_1.5px_0_rgba(185,28,28,0.2)]">
          <p className="font-bold">Search Error</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {/* 4. RESULTS SECTION */}
      {isLoading ? (
        <div className="ks-neo-card rounded-lg border-[1.5px] border-[#241A16] shadow-[2px_3px_0_#241A16] bg-white p-12 text-center space-y-3">
          <div className="inline-flex p-3 rounded-md border border-[#241A16] bg-[#FFF2E6] text-[#F16524] animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="ks-card-title text-base font-serif font-normal text-[#241A16]">Searching Kitsuno library...</h3>
          <p className="text-xs text-neutral-600">
            Finding matching courses, modules, lessons, and quizzes for &ldquo;{inputValue}&rdquo;
          </p>
        </div>
      ) : searchResult ? (
        <div className="space-y-4">
          {/* Results Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[rgba(36,26,22,0.12)]">
            <div>
              <p className="text-base font-serif font-normal text-[#241A16]">
                {searchResult.total_results} {searchResult.total_results === 1 ? 'result' : 'results'} found
                {activeQuery && (
                  <span className="font-normal font-sans text-neutral-600">
                    {' '}for &ldquo;<span className="text-[#241A16] font-semibold">{activeQuery}</span>&rdquo;
                  </span>
                )}
              </p>
              {searchResult.interpreted_query && searchResult.interpreted_query !== activeQuery && (
                <p className="text-xs font-mono text-neutral-500 mt-0.5">
                  Interpreted intent: <span className="italic">{searchResult.interpreted_query}</span>
                </p>
              )}
            </div>

            {/* Content Type Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-neutral-500 mr-1 hidden sm:inline-flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filter:
              </span>
              {[
                { key: 'ALL', label: 'All', count: counts.ALL },
                { key: 'COURSE', label: 'Courses', count: counts.COURSE },
                { key: 'MODULE', label: 'Modules', count: counts.MODULE },
                { key: 'LESSON', label: 'Lessons', count: counts.LESSON },
                { key: 'QUIZ', label: 'Quizzes', count: counts.QUIZ },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTypeFilter(key)}
                  className={`px-2.5 py-1 rounded-[4px] text-xs font-mono font-bold transition-all cursor-pointer ${
                    typeFilter === key
                      ? 'bg-[#F16524] text-white border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16]'
                      : 'bg-white text-[#241A16] hover:bg-[#FAF8F5] border-[1.5px] border-[#241A16] shadow-[1px_1px_0_#241A16]'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          {filteredResults.length === 0 ? (
            <div className="rounded-[8px] border-2 border-[#241A16] bg-white p-10 text-center space-y-3 shadow-[3px_3px_0_#241A16]">
              <Search className="h-8 w-8 text-[#8C827A] mx-auto" />
              <h3 className="ks-card-title text-xl font-serif font-normal text-[#241A16]">No matching content found</h3>
              <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
                No learning materials matched your criteria. Try adjusting your search query or removing filters.
              </p>
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className="ks-neo-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold mt-2"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredResults.map((item) => {
                const config = TYPE_CONFIG[item.content_type] || TYPE_CONFIG.LESSON
                const IconComponent = config.icon

                return (
                  <article
                    key={item.id}
                    className="ks-neo-card rounded-[8px] border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] hover:shadow-[4px_4px_0_#241A16] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] bg-white p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Top Meta: Type badge, Course/Module Breadcrumbs */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[#241A16] text-[10px] font-mono font-bold uppercase tracking-wider ${config.badgeBg}`}
                        >
                          <IconComponent className="h-3 w-3" />
                          {config.label}
                        </span>

                        <span className="text-neutral-500 font-mono text-[11px]">
                          {item.course_title}
                        </span>

                        {item.module_title && (
                          <>
                            <span className="text-neutral-400">›</span>
                            <span className="text-neutral-600 truncate max-w-[200px]">
                              {item.module_title}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-serif font-normal text-lg sm:text-xl text-[#241A16] leading-snug">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgba(36,26,22,0.12)]">
                      <button
                        type="button"
                        onClick={() => navigate(item.action_url)}
                        className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                      >
                        <span>{item.action_label}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      {item.relevance_score > 0 && (
                        <span className="text-[10px] font-mono text-neutral-400">
                          Score: {Math.round(item.relevance_score)}
                        </span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* INITIAL STATE BEFORE QUERY */
        <div className="ks-neo-card rounded-lg border-[1.5px] border-[#241A16] shadow-[2px_3px_0_#241A16] bg-white p-12 text-center space-y-4">
          <div className="inline-flex p-3 rounded-md border-[1.5px] border-[#241A16] bg-[#FFF2E6] text-[#F16524] shadow-[1px_1.5px_0_#241A16]">
            <Search className="h-8 w-8" />
          </div>
          <div>
            <h3 className="ks-card-title text-xl font-serif font-normal text-[#241A16]">Search the Kitsuno Library</h3>
            <p className="text-xs text-neutral-600 mt-1 max-w-md mx-auto leading-relaxed">
              Type any topic, concept, question, or technology name to discover relevant courses, modules, lessons, and quizzes.
            </p>
          </div>
          <div className="pt-2">
            <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Try searching for
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap max-w-lg mx-auto">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-3 py-1.5 rounded-md bg-[#FAF8F5] border-[1.5px] border-[rgba(36,26,22,0.14)] text-xs text-neutral-700 hover:border-[#241A16] hover:bg-[#FFF2E6] hover:text-[#F16524] transition-all cursor-pointer font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
