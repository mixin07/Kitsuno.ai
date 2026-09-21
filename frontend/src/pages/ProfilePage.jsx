import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Mail,
  Shield,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  BookOpen,
  Sparkles,
  BarChart3,
  GraduationCap,
  Clock,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { updateProfile } from '../services/authService.js'
import { getApiErrorMessage } from '../services/api.js'
import { ROLES } from '../constants/roles.js'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    if (!name.trim()) {
      setErrorMessage('Name cannot be empty.')
      return
    }

    if (password && password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = { name: name.trim() }
      if (password) payload.password = password
      const updated = await updateProfile(payload)
      updateUser(updated)
      setPassword('')
      setIsEditing(false)
      setSuccessMessage('Your profile has been updated successfully.')
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    setName(user?.name || '')
    setPassword('')
    setErrorMessage('')
    setIsEditing(false)
  }

  const role = user?.role || ROLES.STUDENT
  const isStudent = role === ROLES.STUDENT
  const isInstructor = role === ROLES.INSTRUCTOR
  const isAdmin = role === ROLES.ADMIN

  const formattedCreatedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently'

  const formattedUpdatedDate = user?.updated_at
    ? new Date(user.updated_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently'

  const userInitial = (user?.name || user?.email || 'U')[0].toUpperCase()

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--ks-orange)] text-2xl sm:text-3xl font-bold text-white shadow-md">
              {userInitial}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-[var(--ks-text)]">
                  {user?.name || 'Kitsuno User'}
                </h1>
                <span className="rounded-full bg-[rgba(241,101,36,0.12)] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[var(--ks-orange)]">
                  {role}
                </span>
              </div>
              <p className="text-sm text-[var(--ks-text-muted)] flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{user?.email || 'No email registered'}</span>
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--ks-orange)] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--ks-orange-light)] focus-visible:outline-none"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Feedback */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Main Profile Details or Edit Form */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Account Details or Edit Form (7/12 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-7 shadow-xs">
            <h2 className="font-display text-xl font-normal text-[var(--ks-text)] mb-6">
              {isEditing ? 'Edit Profile Information' : 'Account Information'}
            </h2>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ks-text-muted)] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-4 py-2.5 text-sm text-[var(--ks-text)] focus:border-[var(--ks-orange)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ks-text-muted)] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full rounded-xl border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] px-4 py-2.5 text-sm text-[var(--ks-text-muted)] cursor-not-allowed opacity-75"
                  />
                  <span className="mt-1 block text-[11px] text-[var(--ks-text-subtle)]">
                    Email address is tied to your login account and cannot be changed here.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ks-text-muted)] mb-2">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    minLength={8}
                    className="w-full rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-4 py-2.5 text-sm text-[var(--ks-text)] focus:border-[var(--ks-orange)] focus:outline-none"
                  />
                  <span className="mt-1 block text-[11px] text-[var(--ks-text-subtle)]">
                    Must be at least 8 characters if changing.
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[var(--ks-border)]">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--ks-orange)] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--ks-orange-light)] disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-4 py-2.5 text-xs font-semibold text-[var(--ks-text-muted)] transition hover:text-[var(--ks-text)]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between py-3 border-b border-[var(--ks-border)]">
                  <span className="text-[var(--ks-text-muted)] flex items-center gap-2">
                    <User className="h-4 w-4 text-[var(--ks-orange)]" />
                    Full Name
                  </span>
                  <span className="font-semibold text-[var(--ks-text)]">
                    {user?.name || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[var(--ks-border)]">
                  <span className="text-[var(--ks-text-muted)] flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[var(--ks-orange)]" />
                    Email Address
                  </span>
                  <span className="font-semibold text-[var(--ks-text)]">
                    {user?.email || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[var(--ks-border)]">
                  <span className="text-[var(--ks-text-muted)] flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[var(--ks-orange)]" />
                    Platform Role
                  </span>
                  <span className="rounded-full bg-[rgba(241,101,36,0.1)] px-2.5 py-0.5 text-xs font-bold text-[var(--ks-orange)]">
                    {role}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[var(--ks-border)]">
                  <span className="text-[var(--ks-text-muted)] flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[var(--ks-orange)]" />
                    Member Since
                  </span>
                  <span className="font-medium text-[var(--ks-text)]">
                    {formattedCreatedDate}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-[var(--ks-text-muted)] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[var(--ks-orange)]" />
                    Last Profile Update
                  </span>
                  <span className="font-medium text-[var(--ks-text)]">
                    {formattedUpdatedDate}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Role Portals & System Shortcuts (5/12 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-7 shadow-xs">
            <h3 className="font-display text-lg font-normal text-[var(--ks-text)] mb-2">
              Role Workspaces
            </h3>
            <p className="text-xs text-[var(--ks-text-muted)] mb-5">
              Authorized areas linked to your {role.toLowerCase()} credentials
            </p>

            <div className="space-y-3">
              {isStudent && (
                <>
                  <Link
                    to="/student"
                    className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--ks-text)]">My Learning Workspace</h4>
                        <p className="text-[11px] text-[var(--ks-text-muted)]">Active courses & progress</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/courses"
                    className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--ks-text)]">Course Catalogue</h4>
                        <p className="text-[11px] text-[var(--ks-text-muted)]">Browse available modules</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/student/analytics"
                    className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--ks-text)]">My Analytics</h4>
                        <p className="text-[11px] text-[var(--ks-text-muted)]">Quiz performance & metrics</p>
                      </div>
                    </div>
                  </Link>
                </>
              )}

              {isInstructor && (
                <>
                  <Link
                    to="/instructor"
                    className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--ks-text)]">Instructor Studio</h4>
                        <p className="text-[11px] text-[var(--ks-text-muted)]">Course management & metrics</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/instructor/ai-quiz-generator"
                    className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--ks-text)]">AI Quiz Generator</h4>
                        <p className="text-[11px] text-[var(--ks-text-muted)]">Synthesize questions from notes</p>
                      </div>
                    </div>
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--ks-text)]">System Administration</h4>
                        <p className="text-[11px] text-[var(--ks-text-muted)]">Platform controls & audit log</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/admin/analytics"
                    className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--ks-text)]">Platform Analytics</h4>
                        <p className="text-[11px] text-[var(--ks-text-muted)]">System-wide performance</p>
                      </div>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
