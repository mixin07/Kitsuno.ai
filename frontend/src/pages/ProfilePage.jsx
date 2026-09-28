import { useEffect, useRef, useState } from 'react'
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
  BarChart3,
  GraduationCap,
  Clock,
  Bookmark,
  ArrowRight,
  Upload,
  Camera,
  RotateCcw,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { updateProfile, uploadAvatar } from '../services/authService.js'
import { getApiErrorMessage } from '../services/api.js'
import { ROLES } from '../constants/roles.js'
import {
  listSavedCourses,
  unsaveCourse,
  listSavedLessons,
  unsaveLesson,
  listSavedNotes,
  unsaveNote,
} from '../services/savedService.js'

const PRESET_AVATARS = [
  { id: 'preset:fox', label: 'Fox', icon: '🦊' },
  { id: 'preset:student', label: 'Student', icon: '🎓' },
  { id: 'preset:astronaut', label: 'Astronaut', icon: '🚀' },
  { id: 'preset:robot', label: 'Robot', icon: '🤖' },
  { id: 'preset:owl', label: 'Owl', icon: '🦉' },
  { id: 'preset:cat', label: 'Cat', icon: '🐱' },
]

function renderAvatarDisplay(avatarValue, initial, size = 'h-full w-full text-2xl') {
  if (avatarValue) {
    if (
      avatarValue.startsWith('blob:') ||
      avatarValue.startsWith('data:image') ||
      avatarValue.startsWith('http') ||
      avatarValue.startsWith('/uploads')
    ) {
      return (
        <img
          src={avatarValue}
          alt="User Avatar"
          className={`${size} rounded-2xl object-cover border border-[#EAD8C7] shadow-xs`}
        />
      )
    }
    const avatarEmojiMap = {
      'preset:fox': '🦊',
      'preset:student': '🎓',
      'preset:astronaut': '🚀',
      'preset:robot': '🤖',
      'preset:owl': '🦉',
      'preset:cat': '🐱',
    }
    const emoji = avatarEmojiMap[avatarValue]
    if (emoji) {
      return (
        <div
          className={`${size} flex items-center justify-center rounded-2xl bg-[#FDF1E6] border border-[#EAD8C7] select-none shadow-xs`}
        >
          {emoji}
        </div>
      )
    }
  }
  return (
    <div
      className={`${size} flex items-center justify-center rounded-2xl bg-[var(--ks-orange)] font-bold text-white shadow-md select-none`}
    >
      {initial}
    </div>
  )
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url || '')
  const [previewAvatar, setPreviewAvatar] = useState(user?.avatar_url || '')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [password, setPassword] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setSelectedAvatar(user.avatar_url || '')
      setPreviewAvatar(user.avatar_url || '')
    }
  }, [user])

  function handleSelectPreset(presetId) {
    if (uploadedFile && previewAvatar?.startsWith('blob:')) {
      URL.revokeObjectURL(previewAvatar)
    }
    setUploadedFile(null)
    setSelectedAvatar(presetId)
    setPreviewAvatar(presetId)
    setErrorMessage('')
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, or WEBP).')
      return
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB.')
      return
    }

    if (uploadedFile && previewAvatar?.startsWith('blob:')) {
      URL.revokeObjectURL(previewAvatar)
    }

    const objectUrl = URL.createObjectURL(file)
    setUploadedFile(file)
    setSelectedAvatar('')
    setPreviewAvatar(objectUrl)
    setErrorMessage('')
  }

  function handleResetAvatar() {
    if (uploadedFile && previewAvatar?.startsWith('blob:')) {
      URL.revokeObjectURL(previewAvatar)
    }
    setUploadedFile(null)
    setSelectedAvatar('')
    setPreviewAvatar('')
    setErrorMessage('')
  }

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
      let finalAvatarUrl = selectedAvatar

      // 1. Upload custom avatar if file was selected
      if (uploadedFile) {
        const uploadRes = await uploadAvatar(uploadedFile)
        finalAvatarUrl = uploadRes.avatar_url
      }

      // 2. Persist profile changes to real backend
      const payload = {
        name: name.trim(),
        avatar_url: finalAvatarUrl,
      }
      if (password) payload.password = password

      const updated = await updateProfile(payload)
      updateUser(updated)

      setSelectedAvatar(updated.avatar_url || '')
      setPreviewAvatar(updated.avatar_url || '')
      setUploadedFile(null)
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
    setSelectedAvatar(user?.avatar_url || '')
    setPreviewAvatar(user?.avatar_url || '')
    if (uploadedFile && previewAvatar?.startsWith('blob:')) {
      URL.revokeObjectURL(previewAvatar)
    }
    setUploadedFile(null)
    setPassword('')
    setErrorMessage('')
    setIsEditing(false)
  }

  const role = user?.role || ROLES.STUDENT
  const isStudent = role === ROLES.STUDENT
  const isInstructor = role === ROLES.INSTRUCTOR
  const isAdmin = role === ROLES.ADMIN

  const [savedCourses, setSavedCourses] = useState([])
  const [savedLessons, setSavedLessons] = useState([])
  const [savedNotes, setSavedNotes] = useState([])
  const [profileSavedTab, setProfileSavedTab] = useState('courses')

  useEffect(() => {
    if (!isStudent) return
    let active = true
    Promise.allSettled([listSavedCourses(), listSavedLessons(), listSavedNotes()]).then(
      ([cRes, lRes, nRes]) => {
        if (!active) return
        if (cRes.status === 'fulfilled') setSavedCourses(cRes.value || [])
        if (lRes.status === 'fulfilled') setSavedLessons(lRes.value || [])
        if (nRes.status === 'fulfilled') setSavedNotes(nRes.value || [])
      },
    )
    return () => {
      active = false
    }
  }, [isStudent])

  async function handleRemoveCourse(courseId) {
    try {
      await unsaveCourse(courseId)
      setSavedCourses((prev) => prev.filter((c) => c.course_id !== courseId))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleRemoveLesson(lessonId) {
    try {
      await unsaveLesson(lessonId)
      setSavedLessons((prev) => prev.filter((l) => l.lesson_id !== lessonId))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleRemoveNote(lessonId) {
    try {
      await unsaveNote(lessonId)
      setSavedNotes((prev) => prev.filter((n) => n.lesson_id !== lessonId))
    } catch (err) {
      console.error(err)
    }
  }

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
      <div className="relative overflow-hidden rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-4 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center">
              {renderAvatarDisplay(
                user?.avatar_url,
                userInitial,
                'h-16 w-16 sm:h-20 sm:w-20 text-2xl sm:text-3xl',
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl sm:text-3xl font-normal tracking-tight text-[var(--ks-text)] truncate max-w-full">
                  {user?.name || 'Kitsuno User'}
                </h1>
                <span className="shrink-0 rounded-full bg-[rgba(241,101,36,0.12)] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[var(--ks-orange)]">
                  {role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--ks-text-muted)] flex items-center gap-1.5 min-w-0">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate break-all sm:break-normal">
                  {user?.email || 'No email registered'}
                </span>
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--ks-orange)] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--ks-orange-light)] focus-visible:outline-none shrink-0 w-fit cursor-pointer"
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
              {isEditing ? 'Edit Profile & Avatar' : 'Account Information'}
            </h2>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Dedicated Profile Picture Section */}
                <div className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--ks-border)] pb-2.5">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-[var(--ks-text)]">
                        Profile Picture
                      </span>
                      <span className="text-[11px] text-[var(--ks-text-muted)]">
                        Choose a preset mascot or upload your custom image
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Current Preview */}
                    <div className="relative shrink-0">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-[var(--ks-orange)]/40 bg-white shadow-2xs">
                        {renderAvatarDisplay(
                          previewAvatar,
                          userInitial,
                          'h-20 w-20 text-3xl',
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ks-orange)] text-white text-[10px] shadow-xs">
                        <Camera className="h-3 w-3" />
                      </span>
                    </div>

                    {/* Upload Controls */}
                    <div className="space-y-2 flex-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--ks-text)] transition hover:border-[var(--ks-orange)] hover:text-[var(--ks-orange)] shadow-2xs cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload Image</span>
                        </button>
                        {(selectedAvatar || uploadedFile) && (
                          <button
                            type="button"
                            onClick={handleResetAvatar}
                            className="inline-flex items-center gap-1 rounded-xl border border-transparent px-2.5 py-2 text-xs font-medium text-[var(--ks-text-muted)] hover:text-rose-600 transition cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--ks-text-subtle)]">
                        PNG, JPG, JPEG, or WEBP (up to 5MB)
                      </p>
                    </div>
                  </div>

                  {/* Preset Avatars Selection */}
                  <div className="space-y-2 pt-2 border-t border-[var(--ks-border)]">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ks-text-muted)]">
                      Or Choose a Preset Avatar
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {PRESET_AVATARS.map((preset) => {
                        const isSelected = selectedAvatar === preset.id && !uploadedFile
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset.id)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[var(--ks-orange)] bg-[rgba(241,101,36,0.12)] shadow-xs scale-102 ring-2 ring-[var(--ks-orange)]/25'
                                : 'border-[var(--ks-border)] bg-[var(--ks-surface)] hover:border-[var(--ks-orange)]/40 hover:bg-[#FFFDF9]'
                            }`}
                          >
                            <div className="h-9 w-9 rounded-lg bg-white border border-[#EAD8C7] flex items-center justify-center text-lg shadow-2xs">
                              {preset.icon}
                            </div>
                            <span
                              className={`text-[10px] font-semibold ${
                                isSelected ? 'text-[var(--ks-orange)]' : 'text-[var(--ks-text)]'
                              }`}
                            >
                              {preset.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

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
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full rounded-xl border border-[var(--ks-border)] bg-[var(--ks-bg-soft)] px-4 py-2.5 text-sm text-[var(--ks-text-muted)] cursor-not-allowed opacity-75"
                  />
                  <span className="mt-1 block text-[11px] text-[var(--ks-text-subtle)]">
                    Email address is tied to your login credentials and cannot be changed here.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ks-text-muted)] mb-2">
                    Platform Role (Read-only)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[rgba(241,101,36,0.1)] px-3 py-1 text-xs font-bold text-[var(--ks-orange)]">
                      {role}
                    </span>
                    <span className="text-[11px] text-[var(--ks-text-subtle)]">
                      Role is managed by system administrator policy.
                    </span>
                  </div>
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
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--ks-orange)] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--ks-orange-light)] disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-4 py-2.5 text-xs font-semibold text-[var(--ks-text-muted)] transition hover:text-[var(--ks-text)] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-[var(--ks-border)]">
                  <span className="text-[var(--ks-text-muted)] flex items-center gap-2 shrink-0">
                    <User className="h-4 w-4 text-[var(--ks-orange)] shrink-0" />
                    Full Name
                  </span>
                  <span className="font-semibold text-[var(--ks-text)] truncate">
                    {user?.name || '—'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-[var(--ks-border)]">
                  <span className="text-[var(--ks-text-muted)] flex items-center gap-2 shrink-0">
                    <Mail className="h-4 w-4 text-[var(--ks-orange)] shrink-0" />
                    Email Address
                  </span>
                  <span className="font-semibold text-[var(--ks-text)] truncate break-all sm:break-normal">
                    {user?.email || '—'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-[var(--ks-border)]">
                  <span className="text-[var(--ks-text-muted)] flex items-center gap-2 shrink-0">
                    <Shield className="h-4 w-4 text-[var(--ks-orange)] shrink-0" />
                    Platform Role
                  </span>
                  <span className="w-fit rounded-full bg-[rgba(241,101,36,0.1)] px-2.5 py-0.5 text-xs font-bold text-[var(--ks-orange)]">
                    {role}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-[var(--ks-border)]">
                  <span className="text-[var(--ks-text-muted)] flex items-center gap-2 shrink-0">
                    <Calendar className="h-4 w-4 text-[var(--ks-orange)] shrink-0" />
                    Member Since
                  </span>
                  <span className="font-medium text-[var(--ks-text)]">
                    {formattedCreatedDate}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3">
                  <span className="text-[var(--ks-text-muted)] flex items-center gap-2 shrink-0">
                    <Clock className="h-4 w-4 text-[var(--ks-orange)] shrink-0" />
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
                        <p className="text-[11px] text-[var(--ks-text-muted)]">Course management & studio</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/instructor/courses"
                    className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(241,101,36,0.1)] text-[var(--ks-orange)]">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--ks-text)]">My Courses</h4>
                        <p className="text-[11px] text-[var(--ks-text-muted)]">Build and publish curricula</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/instructor/analytics"
                    className="flex items-center justify-between rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 transition hover:border-[var(--ks-orange)] hover:bg-[rgba(241,101,36,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--ks-text)]">Course Analytics</h4>
                        <p className="text-[11px] text-[var(--ks-text-muted)]">Learner progress & engagement</p>
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

      {/* 3. Saved Learning Content Section (for students) */}
      {isStudent && (
        <div className="rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ks-border)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-[var(--ks-orange)]" />
                <h2 className="font-display text-xl font-normal text-[var(--ks-text)]">
                  Saved Learning Items
                </h2>
              </div>
              <p className="text-xs text-[var(--ks-text-muted)] mt-1">
                Courses, individual lessons, and study notes saved to your account
              </p>
            </div>
            <Link
              to="/student/learning?tab=saved"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ks-orange)] hover:underline"
            >
              <span>Manage in My Learning</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setProfileSavedTab('courses')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                profileSavedTab === 'courses'
                  ? 'bg-[var(--ks-orange)]/10 text-[var(--ks-orange)] border border-[var(--ks-orange)]/30'
                  : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
              }`}
            >
              Saved Courses ({savedCourses.length})
            </button>
            <button
              type="button"
              onClick={() => setProfileSavedTab('lessons')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                profileSavedTab === 'lessons'
                  ? 'bg-[var(--ks-orange)]/10 text-[var(--ks-orange)] border border-[var(--ks-orange)]/30'
                  : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
              }`}
            >
              Saved Lessons ({savedLessons.length})
            </button>
            <button
              type="button"
              onClick={() => setProfileSavedTab('notes')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                profileSavedTab === 'notes'
                  ? 'bg-[var(--ks-orange)]/10 text-[var(--ks-orange)] border border-[var(--ks-orange)]/30'
                  : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]'
              }`}
            >
              Saved Notes ({savedNotes.length})
            </button>
          </div>

          {/* Tab Content */}
          {profileSavedTab === 'courses' && (
            <div>
              {savedCourses.length === 0 ? (
                <p className="text-xs text-[var(--ks-text-muted)] py-4">No saved courses yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedCourses.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-4 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-orange)]">
                          {item.course?.category || 'Course'}
                        </span>
                        <h4 className="font-semibold text-xs text-[var(--ks-text)] mt-1 line-clamp-1">
                          {item.course?.title || `Course #${item.course_id}`}
                        </h4>
                        {item.course?.description && (
                          <p className="text-[11px] text-[var(--ks-text-muted)] line-clamp-2 mt-1">
                            {item.course.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--ks-border)]/60">
                        <button
                          type="button"
                          onClick={() => handleRemoveCourse(item.course_id)}
                          className="text-[11px] text-[var(--ks-text-muted)] hover:text-rose-600 transition-colors"
                        >
                          Remove
                        </button>
                        <Link
                          to={`/courses/${item.course_id}`}
                          className="text-xs font-semibold text-[var(--ks-orange)] hover:underline"
                        >
                          View Course →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {profileSavedTab === 'lessons' && (
            <div>
              {savedLessons.length === 0 ? (
                <p className="text-xs text-[var(--ks-text-muted)] py-4">No saved lessons yet.</p>
              ) : (
                <div className="space-y-2">
                  {savedLessons.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-orange)] block">
                          {item.course_title}
                        </span>
                        <Link
                          to={`/courses/${item.course_id}/lessons/${item.lesson_id}`}
                          className="text-xs font-semibold text-[var(--ks-text)] hover:text-[var(--ks-orange)] truncate block"
                        >
                          {item.lesson_title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveLesson(item.lesson_id)}
                          className="text-[11px] text-[var(--ks-text-muted)] hover:text-rose-600 transition-colors"
                        >
                          Remove
                        </button>
                        <Link
                          to={`/courses/${item.course_id}/lessons/${item.lesson_id}`}
                          className="rounded-lg bg-[var(--ks-orange)] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[var(--ks-orange-light)]"
                        >
                          Open Lesson →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {profileSavedTab === 'notes' && (
            <div>
              {savedNotes.length === 0 ? (
                <p className="text-xs text-[var(--ks-text-muted)] py-4">No saved AI study notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {savedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-orange)] block">
                          {note.course_title} • {note.lesson_title}
                        </span>
                        <h4 className="text-xs font-semibold text-[var(--ks-text)] truncate">
                          {note.topic || note.lesson_title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveNote(note.lesson_id)}
                          className="text-[11px] text-[var(--ks-text-muted)] hover:text-rose-600 transition-colors"
                        >
                          Remove
                        </button>
                        <Link
                          to={`/courses/${note.course_id}/lessons/${note.lesson_id}`}
                          className="rounded-lg bg-[var(--ks-orange)] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[var(--ks-orange-light)]"
                        >
                          View Notes →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
