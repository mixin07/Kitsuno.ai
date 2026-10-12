import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, ShieldAlert, RotateCw, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

export default function PendingApprovalPage() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')

  const isRejected = user?.approval_status === 'REJECTED'
  const isApproved = user?.approval_status === 'APPROVED' && user?.role === 'INSTRUCTOR'

  useEffect(() => {
    if (isApproved) {
      navigate('/instructor', { replace: true })
    }
  }, [isApproved, navigate])

  async function handleCheckStatus() {
    setIsRefreshing(true)
    setRefreshMessage('')
    try {
      const updated = await refreshUser()
      if (updated?.approval_status === 'APPROVED' && updated?.role === 'INSTRUCTOR') {
        navigate('/instructor', { replace: true })
      } else if (updated?.approval_status === 'REJECTED') {
        setRefreshMessage('Your instructor request was declined by an administrator.')
      } else {
        setRefreshMessage('Status checked. Your application is still pending administrator review.')
      }
    } catch {
      setRefreshMessage('Unable to reach server. Please try again shortly.')
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="ks-app-shell relative flex min-h-screen w-full items-center justify-center bg-[#FDF1E6] px-4 py-8 sm:px-6 sm:py-12 overflow-hidden">
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(241,101,36,0.06)_0%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[550px] w-[550px] rounded-full bg-[radial-gradient(circle,rgba(255,185,120,0.10)_0%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[560px] rounded-[16px] border-2 border-[#241A16] bg-white p-6 sm:p-8 shadow-[6px_6px_0_#241A16]">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-5 border-b-[1.5px] border-[#241A16]">
          <Link to="/" className="flex items-center gap-2.5" title="Kitsuno.ai">
            <img
              src="/logo1.png"
              alt="Kitsuno.ai"
              className="h-8 w-8 rounded-md object-contain"
              draggable="false"
            />
            <div className="flex items-center leading-none">
              <span
                className="font-display text-2xl font-normal tracking-tight text-[#241A16]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Kitsuno
              </span>
              <span
                className="font-display text-2xl font-normal tracking-tight text-[#F16524]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                .ai
              </span>
            </div>
          </Link>

          <span
            className={`inline-flex items-center gap-1.5 rounded-[4px] border border-[#241A16] px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase shadow-[1.5px_1.5px_0_#241A16] ${
              isRejected
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {isRejected ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5 text-rose-700" />
                Declined
              </>
            ) : (
              <>
                <Clock className="h-3.5 w-3.5 text-amber-700 animate-pulse" />
                Pending Review
              </>
            )}
          </span>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-4">
          <div>
            <span className="ks-eyebrow block">VERIFICATION GATEWAY</span>
            <h1
              className="font-display mt-1 text-2xl sm:text-3xl font-normal tracking-tight text-[#241A16]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {isRejected
                ? 'Instructor Application Declined'
                : 'Instructor Access Pending'}
            </h1>
            <p className="mt-2 text-sm text-[#6E5A4E] leading-relaxed">
              {isRejected
                ? 'Your request for instructor privileges was reviewed and declined by an administrator. Contact platform administration if you believe this is in error.'
                : 'Your instructor account request has been submitted. An administrator must approve your account before you can access Instructor Studio.'}
            </p>
          </div>

          {/* User Details Box */}
          <div className="rounded-[8px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-4 space-y-2.5 shadow-[2px_2px_0_#241A16]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8F8177] font-semibold uppercase tracking-wider text-[10px]">
                Applicant Email
              </span>
              <span className="font-mono font-bold text-[#241A16]">
                {user?.email || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8F8177] font-semibold uppercase tracking-wider text-[10px]">
                Full Name
              </span>
              <span className="font-bold text-[#241A16]">
                {user?.name || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8F8177] font-semibold uppercase tracking-wider text-[10px]">
                Requested Role
              </span>
              <span className="rounded-[4px] border border-[#241A16] bg-[#FFF4E6] px-2 py-0.5 text-[10px] font-bold text-[#E8590C]">
                Instructor Studio
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8F8177] font-semibold uppercase tracking-wider text-[10px]">
                Current Status
              </span>
              <span
                className={`font-bold ${
                  isRejected ? 'text-rose-700' : 'text-amber-700'
                }`}
              >
                {isRejected
                  ? 'REJECTED'
                  : 'PENDING ADMINISTRATOR APPROVAL'}
              </span>
            </div>
          </div>

          {/* Feedback Message */}
          {refreshMessage && (
            <div
              className={`rounded-[6px] border-[1.5px] border-[#241A16] p-3 text-xs font-semibold shadow-[1.5px_1.5px_0_#241A16] ${
                isRejected
                  ? 'bg-rose-50 text-rose-800'
                  : 'bg-amber-50 text-amber-900'
              }`}
            >
              {refreshMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {!isRejected && (
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isRefreshing}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-[6px] border-[1.5px] border-[#241A16] bg-[#F16524] px-4 py-2.5 text-xs font-bold text-white shadow-[2px_2px_0_#241A16] hover:bg-[#FF8A4C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-60"
              >
                <RotateCw
                  className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span>{isRefreshing ? 'Checking Status...' : 'Check Approval Status'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={`w-full ${
                !isRejected ? 'sm:w-auto' : 'sm:flex-1'
              } flex items-center justify-center gap-2 rounded-[6px] border-[1.5px] border-[#241A16] bg-white px-4 py-2.5 text-xs font-bold text-[#241A16] shadow-[2px_2px_0_#241A16] hover:bg-[#FFF2E6] hover:text-[#F16524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer`}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
