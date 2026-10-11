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
        <div className="space-y-5 md:space-y-6 w-full max-w-lg mx-auto pb-8 text-center pt-8">
          <div className="ks-neo-card p-8 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-[8px] bg-amber-500/10 border-[1.5px] border-[#241A16] flex items-center justify-center text-amber-700 shadow-[1.5px_1.5px_0_#241A16]">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-[#241A16]">Game Not Found</h2>
              <p className="text-xs text-[#8F8177]">
                The educational game &quot;{gameId}&quot; is not recognized or has been moved.
              </p>
            </div>
            <Link
              to="/student/play"
              className="ks-neo-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Play &amp; Learn</span>
            </Link>
          </div>
        </div>
      )
  }
}
