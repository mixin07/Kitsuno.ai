import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import QuizRushGame from './QuizRushGame.jsx'
import MemoryMatchGame from './MemoryMatchGame.jsx'
import CodeChallengeGame from './CodeChallengeGame.jsx'
import WordScrambleGame from './WordScrambleGame.jsx'
import SpeedRecallGame from './SpeedRecallGame.jsx'
import ConceptMatchGame from './ConceptMatchGame.jsx'

export default function GameRouterPage() {
  const { gameId } = useParams()

  switch (gameId) {
    case 'quiz-rush':
      return <QuizRushGame />
    case 'memory-match':
      return <MemoryMatchGame />
    case 'code-challenge':
    case 'debug-challenge':
      return <CodeChallengeGame />
    case 'word-scramble':
      return <WordScrambleGame />
    case 'speed-recall':
    case 'speed-quiz':
      return <SpeedRecallGame />
    case 'concept-match':
      return <ConceptMatchGame />
    default:
      return (
        <div className="p-8 max-w-lg mx-auto text-center space-y-4">
          <div className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-8 space-y-4 shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-xl text-[var(--ks-text)]">Game Not Found</h2>
              <p className="text-xs text-[var(--ks-text-muted)]">
                The educational game &quot;{gameId}&quot; is not recognized or has been moved.
              </p>
            </div>
            <Link
              to="/student/play"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--ks-orange)] text-white text-xs font-semibold hover:bg-[var(--ks-orange-hover)] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Play &amp; Learn</span>
            </Link>
          </div>
        </div>
      )
  }
}
