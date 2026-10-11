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
          className={`${size} rounded-[8px] object-cover border-[1.5px] border-[#241A16] shadow-[1px_1px_0_#241A16]`}
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
          className={`${size} flex items-center justify-center rounded-[8px] bg-[#FDF1E6] border-[1.5px] border-[#241A16] select-none shadow-[1px_1px_0_#241A16]`}
        >
          {emoji}
        </div>
      )
    }
  }
  return (
    <div
      className={`${size} flex items-center justify-center rounded-[8px] bg-[#F16524] font-bold text-white border-[1.5px] border-[#241A16] shadow-[1px_1px_0_#241A16] select-none`}
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
    <div className="space-y-5 md:space-y-6 w-full pb-8">
      {/* 1. Standardized Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-[1.5px] border-[#241A16]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="ks-eyebrow">
              ACCOUNT & PROFILE
            </span>
            <span className="w-1.5 h-1.5 bg-[#F16524]" />
          </div>

          <h1 className="ks-page-title">
            Profile & Settings
          </h1>

          <p className="ks-muted">
            Manage your personal credentials, custom avatar, and learning workspace.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="ks-neo-btn-primary px-5 py-2 text-xs shrink-0 w-fit"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* 2. User Identity Card (Level 1 Neo Card) */}
      <div className="ks-neo-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-[8px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] overflow-hidden shadow-[1.5px_2px_0_#241A16]">
              {renderAvatarDisplay(
                user?.avatar_url,
                userInitial,
                'h-16 w-16 sm:h-20 sm:w-20 text-2xl sm:text-3xl',
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="ks-neo-card-title truncate max-w-full">
                  {user?.name || 'Kitsuno User'}
                </h2>
                <span className="shrink-0 rounded-[4px] border border-[#241A16] bg-[#F16524]/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[#F16524]">
                  {role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 flex items-center gap-1.5 min-w-0">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#F16524]" />
                <span className="truncate break-all sm:break-normal font-mono text-xs">
                  {user?.email || 'No email registered'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications / Feedback */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-md border-[1.5px] border-[#241A16] bg-emerald-100 p-4 font-mono text-xs text-emerald-900 shadow-[1px_2px_0_#241A16]">
          <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-md border-[1.5px] border-[#241A16] bg-rose-100 p-4 font-mono text-xs text-rose-900 shadow-[1px_2px_0_#241A16]">
          <AlertCircle className="h-5 w-5 text-rose-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Main Profile Details or Edit Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Account Details or Edit Form (7/12 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="bg-white rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] p-5 sm:p-6">
            <div className="ks-neo-card-header">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#F16524]" />
                <h2 className="ks-neo-card-title">
                  {isEditing ? 'Edit Profile & Avatar' : 'Account Information'}
                </h2>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Dedicated Profile Picture Section */}
                <div className="rounded-md border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[rgba(36,26,22,0.12)] pb-2.5">
                    <div>
                      <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#241A16]">
                        Profile Picture
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Choose a preset mascot or upload your custom image
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Current Preview */}
                    <div className="relative shrink-0">
                      <div className="h-20 w-20 rounded-lg overflow-hidden flex items-center justify-center border-[1.5px] border-[#241A16] bg-white shadow-[1px_2px_0_#241A16]">
                        {renderAvatarDisplay(
                          previewAvatar,
                          userInitial,
                          'h-20 w-20 text-3xl',
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F16524] text-white text-[10px] border border-[#241A16]">
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
                          className="ks-neo-btn-secondary px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload Image</span>
                        </button>
                        {(selectedAvatar || uploadedFile) && (
                          <button
                            type="button"
                            onClick={handleResetAvatar}
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase text-neutral-500 hover:text-rose-600 transition cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-neutral-400">
                        PNG, JPG, JPEG, or WEBP (up to 5MB)
                      </p>
                    </div>
                  </div>

                  {/* Preset Avatars Selection */}
                  <div className="space-y-2 pt-2 border-t border-[rgba(36,26,22,0.12)]">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
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
                            className={`flex flex-col items-center gap-1 p-2 rounded-md border-[1.5px] transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#241A16] bg-[#F16524]/10 shadow-[1px_2px_0_#241A16]'
                                : 'border-[rgba(36,26,22,0.18)] bg-white hover:border-[#241A16]'
                            }`}
                          >
                            <div className="h-9 w-9 rounded-md bg-[#FAF8F5] border border-[rgba(36,26,22,0.18)] flex items-center justify-center text-lg">
                              {preset.icon}
                            </div>
                            <span
                              className={`font-mono text-[10px] font-bold uppercase ${
                                isSelected ? 'text-[#F16524]' : 'text-[#241A16]'
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
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-9 rounded-[6px] border-[1.5px] border-[#241A16] bg-white px-3.5 text-xs text-[#241A16] focus:border-[#F16524] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full h-9 rounded-[6px] border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] px-3.5 font-mono text-xs text-neutral-500 cursor-not-allowed opacity-75"
                  />
                  <span className="mt-1 block text-[10px] font-mono text-neutral-400">
                    Email address is tied to your login credentials and cannot be changed here.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Platform Role (Read-only)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="rounded-[4px] border border-[#241A16] bg-[#F16524]/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[#F16524]">
                      {role}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Role is managed by system administrator policy.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    minLength={8}
                    className="w-full h-9 rounded-[6px] border-[1.5px] border-[#241A16] bg-white px-3.5 text-xs text-[#241A16] focus:border-[#F16524] outline-none"
                  />
                  <span className="mt-1 block text-[10px] font-mono text-neutral-400">
                    Must be at least 8 characters if changing.
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[rgba(36,26,22,0.12)]">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ks-neo-btn-primary px-5 py-2 text-xs"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="ks-neo-btn-secondary px-4 py-2 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-[rgba(36,26,22,0.12)]">
                  <span className="text-neutral-500 font-mono text-xs flex items-center gap-2 shrink-0">
                    <User className="h-4 w-4 text-[#F16524] shrink-0" />
                    Full Name
                  </span>
                  <span className="font-semibold text-sm text-[#241A16] truncate">
                    {user?.name || '—'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-[rgba(36,26,22,0.12)]">
                  <span className="text-neutral-500 font-mono text-xs flex items-center gap-2 shrink-0">
                    <Mail className="h-4 w-4 text-[#F16524] shrink-0" />
                    Email Address
                  </span>
                  <span className="font-mono text-xs text-[#241A16] truncate break-all sm:break-normal">
                    {user?.email || '—'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-[rgba(36,26,22,0.12)]">
                  <span className="text-neutral-500 font-mono text-xs flex items-center gap-2 shrink-0">
                    <Shield className="h-4 w-4 text-[#F16524] shrink-0" />
                    Platform Role
                  </span>
                  <span className="w-fit rounded-[4px] border border-[#241A16] bg-[#F16524]/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[#F16524]">
                    {role}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-[rgba(36,26,22,0.12)]">
                  <span className="text-neutral-500 font-mono text-xs flex items-center gap-2 shrink-0">
                    <Calendar className="h-4 w-4 text-[#F16524] shrink-0" />
                    Member Since
                  </span>
                  <span className="font-mono text-xs text-neutral-600">
                    {formattedCreatedDate}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3">
                  <span className="text-neutral-500 font-mono text-xs flex items-center gap-2 shrink-0">
                    <Clock className="h-4 w-4 text-[#F16524] shrink-0" />
                    Last Profile Update
                  </span>
                  <span className="font-mono text-xs text-neutral-600">
                    {formattedUpdatedDate}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Role Portals & System Shortcuts (5/12 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="bg-white rounded-[8px] border-2 border-[#241A16] shadow-[4px_4px_0_#241A16] p-5 sm:p-6">
            <div className="ks-neo-card-header">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#F16524]" />
                <h3 className="ks-neo-card-title">
                  Role Workspaces
                </h3>
              </div>
            </div>
            <p className="ks-muted mb-4 -mt-2">
              Authorized areas linked to your {role.toLowerCase()} credentials
            </p>

            <div className="space-y-3">
              {isStudent && (
                <>
                  <Link
                    to="/student"
                    className="flex items-center justify-between rounded-[6px] border-[1.5px] border-[#241A16] bg-white shadow-[2px_2px_0_#241A16] p-3.5 transition-all hover:bg-[#FAF8F5] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-[#241A16] bg-[#F16524]/10 text-[#F16524]">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#241A16]">My Learning Workspace</h4>
                        <p className="text-[11px] text-neutral-500">Active courses & progress</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                  </Link>

                  <Link
                    to="/courses"
                    className="flex items-center justify-between rounded-[6px] border-[1.5px] border-[#241A16] bg-white shadow-[2px_2px_0_#241A16] p-3.5 transition-all hover:bg-[#FAF8F5] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-[#241A16] bg-[#F16524]/10 text-[#F16524]">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#241A16]">Course Catalogue</h4>
                        <p className="text-[11px] text-neutral-500">Browse available modules</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                  </Link>

                  <Link
                    to="/student/analytics"
                    className="flex items-center justify-between rounded-[6px] border-[1.5px] border-[#241A16] bg-white shadow-[2px_2px_0_#241A16] p-3.5 transition-all hover:bg-[#FAF8F5] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-[#241A16] bg-amber-500/10 text-amber-700">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#241A16]">My Analytics</h4>
                        <p className="text-[11px] text-neutral-500">Quiz performance & metrics</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                  </Link>
                </>
              )}

              {isInstructor && (
                <>
                  <Link
                    to="/instructor"
                    className="flex items-center justify-between rounded-lg border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] p-3.5 transition hover:border-[#241A16] hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-[#241A16] bg-[#F16524]/10 text-[#F16524]">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#241A16]">Instructor Studio</h4>
                        <p className="text-[11px] text-neutral-500">Course management & studio</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                  </Link>

                  <Link
                    to="/instructor/courses"
                    className="flex items-center justify-between rounded-lg border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] p-3.5 transition hover:border-[#241A16] hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-[#241A16] bg-[#F16524]/10 text-[#F16524]">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#241A16]">My Courses</h4>
                        <p className="text-[11px] text-neutral-500">Build and publish curricula</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                  </Link>

                  <Link
                    to="/instructor/analytics"
                    className="flex items-center justify-between rounded-lg border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] p-3.5 transition hover:border-[#241A16] hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-[#241A16] bg-amber-500/10 text-amber-700">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#241A16]">Course Analytics</h4>
                        <p className="text-[11px] text-neutral-500">Learner progress & engagement</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center justify-between rounded-lg border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] p-3.5 transition hover:border-[#241A16] hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-[#241A16] bg-[#F16524]/10 text-[#F16524]">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#241A16]">System Administration</h4>
                        <p className="text-[11px] text-neutral-500">Platform controls & audit log</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                  </Link>

                  <Link
                    to="/admin/analytics"
                    className="flex items-center justify-between rounded-lg border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] p-3.5 transition hover:border-[#241A16] hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-[#241A16] bg-amber-500/10 text-amber-700">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#241A16]">Platform Analytics</h4>
                        <p className="text-[11px] text-neutral-500">System-wide performance</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Saved Learning Content Section (for students) */}
      {isStudent && (
        <div className="ks-neo-card p-5 sm:p-6 space-y-5">
          <div className="ks-neo-card-header">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-[#F16524]" />
              <h2 className="ks-neo-card-title">
                Saved Learning Items
              </h2>
            </div>
            <Link
              to="/student/learning?tab=saved"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F16524] hover:underline"
            >
              <span>Manage in My Learning</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Sub-tabs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setProfileSavedTab('courses')}
              className={`rounded-[6px] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                profileSavedTab === 'courses'
                  ? 'bg-[#241A16] text-white border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16]'
                  : 'bg-white text-[#241A16] border-[1.5px] border-[rgba(36,26,22,0.18)] hover:border-[#241A16]'
              }`}
            >
              Saved Courses ({savedCourses.length})
            </button>
            <button
              type="button"
              onClick={() => setProfileSavedTab('lessons')}
              className={`rounded-[6px] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                profileSavedTab === 'lessons'
                  ? 'bg-[#241A16] text-white border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16]'
                  : 'bg-white text-[#241A16] border-[1.5px] border-[rgba(36,26,22,0.18)] hover:border-[#241A16]'
              }`}
            >
              Saved Lessons ({savedLessons.length})
            </button>
            <button
              type="button"
              onClick={() => setProfileSavedTab('notes')}
              className={`rounded-[6px] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                profileSavedTab === 'notes'
                  ? 'bg-[#241A16] text-white border-[1.5px] border-[#241A16] shadow-[1.5px_1.5px_0_#241A16]'
                  : 'bg-white text-[#241A16] border-[1.5px] border-[rgba(36,26,22,0.18)] hover:border-[#241A16]'
              }`}
            >
              Saved Notes ({savedNotes.length})
            </button>
          </div>

          {/* Tab Content */}
          {profileSavedTab === 'courses' && (
            <div>
              {savedCourses.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 font-mono">No saved courses yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedCourses.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] p-4 flex flex-col justify-between space-y-3 hover:border-[#241A16] transition"
                    >
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524]">
                          {item.course?.category || 'Course'}
                        </span>
                        <h4 className="font-serif font-normal text-base text-[#241A16] mt-1 line-clamp-1">
                          {item.course?.title || `Course #${item.course_id}`}
                        </h4>
                        {item.course?.description && (
                          <p className="text-[11px] text-neutral-600 line-clamp-2 mt-1">
                            {item.course.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[rgba(36,26,22,0.12)]">
                        <button
                          type="button"
                          onClick={() => handleRemoveCourse(item.course_id)}
                          className="text-[11px] font-mono text-neutral-500 hover:text-red-600 transition-colors font-medium"
                        >
                          Remove
                        </button>
                        <Link
                          to={`/courses/${item.course_id}`}
                          className="ks-neo-btn-secondary px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <span>View Course</span>
                          <ArrowRight className="h-3 w-3" />
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
                <p className="text-xs text-neutral-500 py-4 font-mono">No saved lessons yet.</p>
              ) : (
                <div className="space-y-2">
                  {savedLessons.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] p-3 flex items-center justify-between gap-3 hover:border-[#241A16] transition"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524] block">
                          {item.course_title}
                        </span>
                        <Link
                          to={`/courses/${item.course_id}/lessons/${item.lesson_id}`}
                          className="text-xs font-bold text-[#241A16] hover:text-[#F16524] truncate block"
                        >
                          {item.lesson_title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveLesson(item.lesson_id)}
                          className="text-[11px] font-mono text-neutral-500 hover:text-red-600 transition-colors font-medium"
                        >
                          Remove
                        </button>
                        <Link
                          to={`/courses/${item.course_id}/lessons/${item.lesson_id}`}
                          className="ks-neo-btn-primary px-3 py-1 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <span>Open Lesson</span>
                          <ArrowRight className="h-3 w-3" />
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
                <p className="text-xs text-neutral-500 py-4 font-mono">No saved AI study notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {savedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border-[1.5px] border-[rgba(36,26,22,0.18)] bg-[#FAF8F5] p-3 flex items-center justify-between gap-3 hover:border-[#241A16] transition"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F16524] block">
                          {note.course_title} • {note.lesson_title}
                        </span>
                        <h4 className="text-xs font-bold text-[#241A16] truncate">
                          {note.topic || note.lesson_title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveNote(note.lesson_id)}
                          className="text-[11px] font-mono text-neutral-500 hover:text-red-600 transition-colors font-medium"
                        >
                          Remove
                        </button>
                        <Link
                          to={`/courses/${note.course_id}/lessons/${note.lesson_id}`}
                          className="ks-neo-btn-primary px-3 py-1 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <span>View Notes</span>
                          <ArrowRight className="h-3 w-3" />
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
