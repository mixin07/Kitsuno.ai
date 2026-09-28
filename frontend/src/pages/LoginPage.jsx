import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Lottie } from 'lottie-react'
import { roleHomePath } from '../constants/roles.js'
import { useAuth } from '../hooks/useAuth.js'
import { getApiErrorMessage } from '../services/api.js'
import examsPreparation from '../assets/exams-preparation.json'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState(location.state?.message || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (location.state?.message) {
      window.history.replaceState({}, '')
    }
  }, [location.state])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setInfo('')
    setIsSubmitting(true)
    try {
      const user = await login({ email, password })
      navigate(roleHomePath(user.role), { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

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
      <div className="relative z-10 w-full max-w-[1060px] rounded-[32px] border border-[rgba(36,26,22,0.08)] bg-[#FFF9F2] shadow-[0_20px_50px_-15px_rgba(90,55,30,0.07),0_2px_8px_rgba(90,55,30,0.03)] overflow-hidden">
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
                WELCOME TO KITSUNO.AI
              </p>

              <h2
                className="mt-1.5 font-display text-2xl sm:text-3xl lg:text-[2.1rem] font-normal leading-[1.12] tracking-tight text-[#241A16]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Learn smarter.
                <br />
                <span className="italic text-[#F16524]">Not harder.</span>
              </h2>

              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--ks-text-muted)]">
                An AI-powered learning environment engineered to prove comprehension through structured courses, automated quizzes, and retention tracking.
              </p>

              {/* 3 Small Benefit Points */}
              <ul className="mt-4 space-y-2 text-xs text-[var(--ks-text-muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#F16524]" />
                  <span className="font-medium text-[#241A16]">Structured learning paths</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#F16524]" />
                  <span className="font-medium text-[#241A16]">AI-generated practice & quizzes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#F16524]" />
                  <span className="font-medium text-[#241A16]">Track progress and retain more</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel: Clean bright white (#FFFFFF) login form */}
          <div className="flex flex-col justify-center bg-[#FFFFFF] p-7 sm:p-9 lg:p-11">
            <div>
              <h1
                className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-[#241A16]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Welcome back
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[var(--ks-text-muted)]">
                Sign in to continue your personalized learning journey.
              </p>
            </div>

            {info && (
              <div className="ks-alert ks-alert--success mt-4 mb-2" role="status">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--ks-success)]" />
                <span className="text-xs sm:text-sm font-medium">{info}</span>
              </div>
            )}

            {error && (
              <div className="ks-alert ks-alert--error mt-4 mb-2" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0 text-[var(--ks-error)]" />
                <span className="text-xs sm:text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#241A16] mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(90,55,30,0.16)] bg-[#FFFDF9] text-sm text-[#241A16] placeholder-[var(--ks-text-subtle)] focus:outline-none focus:border-[#F16524] focus:ring-2 focus:ring-[rgba(241,101,36,0.18)] transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#241A16]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setInfo('Password reset instructions will be sent to your registered email.')}
                    className="text-xs font-medium text-[#F16524] hover:text-[#8F3215] transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[rgba(90,55,30,0.16)] bg-[#FFFDF9] text-sm text-[#241A16] placeholder-[var(--ks-text-subtle)] focus:outline-none focus:border-[#F16524] focus:ring-2 focus:ring-[rgba(241,101,36,0.18)] transition-all"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--ks-text-subtle)] transition-colors hover:text-[#241A16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F16524]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#F16524] hover:bg-[#D95318] text-white font-semibold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F16524] focus:ring-offset-2 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-white mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4 text-center">
              <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-[rgba(90,55,30,0.1)]" />
              <span className="relative bg-white px-3 text-[11px] uppercase tracking-wider text-[var(--ks-text-subtle)] font-medium">
                or
              </span>
            </div>

            {/* Google Sign In Option */}
            <button
              type="button"
              onClick={() => setInfo('Google authentication is coming soon. Please sign in with your email and password.')}
              className="w-full py-2.5 px-4 rounded-xl border border-[rgba(90,55,30,0.16)] bg-white hover:bg-[var(--ks-bg-soft)] text-xs sm:text-sm font-medium text-[#241A16] transition-colors flex items-center justify-center gap-2.5 shadow-xs"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            {/* Footer Links */}
            <div className="mt-5 text-center text-xs sm:text-sm text-[var(--ks-text-muted)]">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#F16524] transition-colors hover:text-[#8F3215] hover:underline"
              >
                Create one
              </Link>
            </div>

            <p className="mt-3.5 text-center text-xs text-[var(--ks-text-subtle)]">
              <Link
                to="/"
                className="inline-flex items-center gap-1 transition-colors hover:text-[#241A16] hover:underline"
              >
                ← Return to homepage
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}