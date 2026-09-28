import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Eye, EyeOff, GraduationCap, BookOpen, ArrowRight } from 'lucide-react'
import { Lottie } from 'lottie-react'
import { useAuth } from '../hooks/useAuth.js'
import { getApiErrorMessage } from '../services/api.js'
import examsPreparation from '../assets/exams-preparation.json'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState('STUDENT') // 'STUDENT' | 'INSTRUCTOR'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await register({ name, email, password, role })
      navigate('/login', {
        replace: true,
        state: { message: 'Account created successfully. Please sign in.' },
      })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStudent = role === 'STUDENT'

  return (
    <main className="ks-app-shell relative flex min-h-screen w-full items-center justify-center bg-[#FDF1E6] px-4 py-8 sm:px-6 sm:py-12 overflow-hidden">
      {/* Subtle atmospheric ambient glow shapes */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(241,101,36,0.06)_0%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[550px] w-[550px] rounded-full bg-[radial-gradient(circle,rgba(255,185,120,0.10)_0%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />

      {/* Main Two-Panel Centered Split Card (Equal Width, Equal Height) */}
      <div className="relative z-10 w-full max-w-[1080px] rounded-[32px] border border-[rgba(36,26,22,0.08)] bg-[#FFF9F2] shadow-[0_20px_50px_-15px_rgba(90,55,30,0.07),0_2px_8px_rgba(90,55,30,0.03)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
          {/* Left Panel: Light near-white cream surface (#FFFDF9), storytelling with genuine Lottie */}
          <div className="flex flex-col justify-between bg-[#FFFDF9] p-7 sm:p-9 lg:p-11 md:border-r md:border-[rgba(36,26,22,0.06)]">
            {/* Top: Branding */}
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F16524]"
                aria-label="Kitsuno.ai Home"
              >
                <img
                  src="/logo1.png"
                  alt="Kitsuno.ai"
                  className="h-8 w-8 rounded-md object-contain"
                  draggable="false"
                />
                <span
                  className="font-display text-2xl font-normal tracking-tight text-[#241A16]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Kitsuno<span className="text-[#F16524]">.ai</span>
                </span>
              </Link>
            </div>

            {/* Middle: Educational Illustration */}
            <div className="my-5 flex w-full items-center justify-center overflow-hidden">
              <Lottie
                src={examsPreparation}
                loop
                autoplay
                className="h-[155px] sm:h-[175px] w-full max-w-[280px] object-contain"
                aria-hidden="true"
              />
            </div>

            {/* Editorial Content */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ks-text-subtle)]">
                START YOUR JOURNEY
              </p>

              <h2
                className="font-display mt-2 text-2xl font-normal tracking-tight text-[#241A16] sm:text-3xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Master comprehension.
                <br />
                <span className="italic text-[#F16524]">Retain everything.</span>
              </h2>

              <p className="mt-2.5 text-sm leading-relaxed text-[#6E5A4E]">
                An AI-powered learning environment engineered to prove comprehension
                through structured courses, automated quizzes, and retention tracking.
              </p>

              {/* Checkpoints */}
              <ul className="mt-5 space-y-2 text-xs text-[#6E5A4E]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#F16524] shrink-0" />
                  <span>Structured learning paths and lessons</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#F16524] shrink-0" />
                  <span>AI-generated practice and dynamic quizzes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#F16524] shrink-0" />
                  <span>{isStudent ? 'Track progress and retain more' : 'Author courses and monitor learner mastery'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel: Crisp White surface (#FFFFFF), Registration form */}
          <div className="flex flex-col justify-between bg-[#FFFFFF] p-7 sm:p-9 lg:p-11">
            <div>
              <h1
                className="font-display text-3xl font-normal tracking-tight text-[#241A16] sm:text-[34px]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Create account
              </h1>
              <p className="mt-1 text-sm text-[#6E5A4E]">
                Start your personalized learning journey with Kitsuno.ai.
              </p>

              {/* Student / Instructor Segmented Control */}
              <div className="mt-5">
                <div
                  className="inline-flex w-full rounded-xl bg-[#FDF1E6] p-1 border border-[rgba(36,26,22,0.08)]"
                  role="tablist"
                  aria-label="Account role"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isStudent}
                    onClick={() => setRole('STUDENT')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all duration-200 ${
                      isStudent
                        ? 'bg-[#F16524] text-white shadow-sm'
                        : 'text-[#6E5A4E] hover:text-[#241A16]'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!isStudent}
                    onClick={() => setRole('INSTRUCTOR')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all duration-200 ${
                      !isStudent
                        ? 'bg-[#F16524] text-white shadow-sm'
                        : 'text-[#6E5A4E] hover:text-[#241A16]'
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Instructor</span>
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-[#9C8577]">
                  {isStudent
                    ? 'Free starter access with instant AI quiz generation included.'
                    : 'Create and publish courses, generate quizzes, and view learner analytics.'}
                </p>
              </div>

              {/* Feedback Alerts */}
              {error && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-[rgba(184,58,32,0.25)] bg-[#FDF0ED] p-3 text-xs text-[#B83A20]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5" noValidate>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6E5A4E]"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    autoComplete="name"
                    className="mt-1 block w-full rounded-xl border border-[rgba(36,26,22,0.12)] bg-[#FFFAF4] px-3.5 py-2 text-sm text-[#241A16] placeholder:text-[#9C8577] transition-all focus:border-[#F16524] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F16524]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6E5A4E]"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="mt-1 block w-full rounded-xl border border-[rgba(36,26,22,0.12)] bg-[#FFFAF4] px-3.5 py-2 text-sm text-[#241A16] placeholder:text-[#9C8577] transition-all focus:border-[#F16524] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F16524]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6E5A4E]"
                  >
                    Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className="block w-full rounded-xl border border-[rgba(36,26,22,0.12)] bg-[#FFFAF4] px-3.5 py-2 pr-10 text-sm text-[#241A16] placeholder:text-[#9C8577] transition-all focus:border-[#F16524] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F16524]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8577] transition-colors hover:text-[#241A16]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6E5A4E]"
                  >
                    Confirm Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      className="block w-full rounded-xl border border-[rgba(36,26,22,0.12)] bg-[#FFFAF4] px-3.5 py-2 pr-10 text-sm text-[#241A16] placeholder:text-[#9C8577] transition-all focus:border-[#F16524] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F16524]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8577] transition-colors hover:text-[#241A16]"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F16524] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(241,101,36,0.25)] transition-all hover:bg-[#FF8A4C] hover:shadow-[0_4px_16px_rgba(241,101,36,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F16524] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating account...
                    </span>
                  ) : (
                    <>
                      <span>Create account</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Links */}
            <div className="mt-5 space-y-2 text-center text-xs">
              <p className="text-[#6E5A4E]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[#F16524] hover:underline"
                >
                  Sign in
                </Link>
              </p>
              <div>
                <Link
                  to="/"
                  className="text-[#9C8577] transition-colors hover:text-[#241A16]"
                >
                  ← Return to homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}