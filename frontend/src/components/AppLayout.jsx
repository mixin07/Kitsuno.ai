import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  BarChart3,
  GraduationCap,
  Sparkles,
  PlusCircle,
  Settings,
  Bell,
  Menu,
  X,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardCheck,
  CalendarCheck,
  Bookmark,
  Gamepad2,
  User,
  HelpCircle,
  LogOut,
  Flame,
  Zap,
  Award,
  UserCheck,
} from 'lucide-react'
import { ROLES, roleHomePath } from '../constants/roles.js'
import { useAuth } from '../hooks/useAuth.js'
import { getGamificationMe } from '../services/gamificationService.js'
import StreakDetailsModal from './modals/StreakDetailsModal.jsx'
import XpRewardsModal from './modals/XpRewardsModal.jsx'
import LevelProgressModal from './modals/LevelProgressModal.jsx'
import NotificationsPanel from './modals/NotificationsPanel.jsx'

function isRouteActive(to, pathname, currentSearch = '') {
  if (!to || !pathname) return false

  const [toPath, toQuery] = to.split('?')
  const normPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const normTo = toPath.length > 1 && toPath.endsWith('/') ? toPath.slice(0, -1) : toPath

  // Query parameter match (e.g. /student/learning?tab=saved)
  if (toQuery) {
    return normPath === normTo && currentSearch.includes(toQuery)
  }
  // If `to` has no query param, but we're on /student/learning?tab=saved, don't mark regular My Learning active
  if (normTo === '/student/learning' && normPath === '/student/learning' && currentSearch.includes('tab=saved')) {
    return false
  }

  if (normPath === normTo) return true
  if ((normTo === '/ai-chat' || normTo === '/ai/chat') && (normPath === '/ai-chat' || normPath === '/ai/chat')) return true
  if (normTo === '/settings' && normPath === '/settings') return true
  if (normTo === '/profile' && normPath === '/profile') return true

  // Parent-child route ownership rules:
  // 1. /courses owns /courses/:courseId and /courses/:courseId/lessons/:lessonId
  if (normTo === '/courses') {
    return normPath.startsWith('/courses/') && !normPath.startsWith('/instructor')
  }

  // 2. /instructor/courses owns /instructor/courses/:id/edit and /instructor/courses/:id/content (EXCEPT /instructor/courses/new)
  if (normTo === '/instructor/courses') {
    return normPath.startsWith('/instructor/courses/') && normPath !== '/instructor/courses/new'
  }

  // 3. /student/quizzes owns student quiz execution pages /student/quiz/...
  if (normTo === '/student/quizzes') {
    return normPath.startsWith('/student/quiz')
  }

  // 4. /student/play owns all game routes under /student/play/
  if (normTo === '/student/play') {
    return normPath.startsWith('/student/play')
  }

  // 5. /student/study-plan owns study plan routes
  if (normTo === '/student/study-plan') {
    return normPath.startsWith('/student/study-plan')
  }

  // 6. Practice & Search routes
  if (normTo === '/student/mock-exams') {
    return normPath.startsWith('/student/mock-exams')
  }
  if (normTo === '/student/question-bank') {
    return normPath.startsWith('/student/question-bank')
  }
  if (normTo === '/student/ai-search') {
    return normPath.startsWith('/student/ai-search')
  }

  return false
}

function SidebarNavItem({ to, icon: Icon, label, currentPath, currentSearch = '', onClick, badge, collapsed, disabled }) {
  const active = !disabled && isRouteActive(to, currentPath, currentSearch)

  if (disabled) {
    return (
      <div className="group relative">
        <div
          className={`relative flex items-center ${
            collapsed ? 'justify-center h-9 w-9 mx-auto' : 'justify-between px-2.5 py-1.5'
          } rounded-lg text-sm font-medium opacity-60 cursor-not-allowed select-none`}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
            <Icon className="h-4 w-4 shrink-0 text-[#A2958D]" strokeWidth={1.5} />
            {!collapsed && <span className="truncate tracking-tight text-[13px] text-[#A2958D] font-normal">{label}</span>}
          </div>
          {!collapsed && (
            <span className="rounded bg-[#EAD8C7]/60 border border-[#DFCEBD] px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase text-[#6F625B]">
              Soon
            </span>
          )}
        </div>
        {collapsed && (
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 rounded-[5px] border-[1.5px] border-[#241A16] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#241A16] shadow-[2px_2px_0_#241A16] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            {label} (Soon)
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="group relative">
      <Link
        to={to}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? label : undefined}
        className={`relative flex items-center ${
          collapsed ? 'justify-center h-9 w-9 mx-auto' : 'justify-between px-2.5 py-1.5'
        } rounded-[6px] text-sm transition-all duration-150 ${
          active
            ? 'bg-white text-[#241A16] font-semibold shadow-[2px_2px_0_#241A16] border-[1.5px] border-[#241A16]'
            : 'text-[#6F625B] hover:bg-black/[0.04] hover:text-[#241A16] font-medium border border-transparent'
        }`}
      >
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
          {/* Active Indicator: 3px orange vertical pill on left edge */}
          {active && (
            <span
              className="absolute left-1 top-1/2 -translate-y-1/2 h-3.5 w-1 rounded-full bg-[#F16524]"
              aria-hidden="true"
            />
          )}
          <Icon
            className={`h-4 w-4 shrink-0 transition-colors ${
              active ? 'text-[#F16524]' : 'text-[#8F8177] group-hover:text-[#241A16]'
            }`}
            strokeWidth={active ? 2.2 : 1.7}
          />
          {!collapsed && <span className="truncate tracking-tight text-[13px]">{label}</span>}
        </div>
        {!collapsed && badge && (
          <span
            className={`rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase ${
              active
                ? 'bg-[#F16524]/10 text-[#F16524]'
                : 'bg-[#EAD8C7]/70 text-[#6F625B]'
            }`}
          >
            {badge}
          </span>
        )}
      </Link>

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 rounded-[5px] border-[1.5px] border-[#241A16] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#241A16] shadow-[2px_2px_0_#241A16] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  )
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [streakModalOpen, setStreakModalOpen] = useState(false)
  const [xpModalOpen, setXpModalOpen] = useState(false)
  const [levelModalOpen, setLevelModalOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const profileHoverTimeoutRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)

  // Global listeners for opening detail modals from dashboard cards
  useEffect(() => {
    function handleOpenStreak() { setStreakModalOpen(true) }
    function handleOpenXp() { setXpModalOpen(true) }
    function handleOpenLevel() { setLevelModalOpen(true) }

    window.addEventListener('open-streak-modal', handleOpenStreak)
    window.addEventListener('open-xp-modal', handleOpenXp)
    window.addEventListener('open-level-modal', handleOpenLevel)

    return () => {
      window.removeEventListener('open-streak-modal', handleOpenStreak)
      window.removeEventListener('open-xp-modal', handleOpenXp)
      window.removeEventListener('open-level-modal', handleOpenLevel)
    }
  }, [])

  // Cmd+K or Ctrl+K focus search bar shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          searchInputRef.current.select()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Live gamification data for student topbar indicators
  const [gamification, setGamification] = useState(null)

  useEffect(() => {
    let active = true
    if (!user || user.role !== ROLES.STUDENT) {
      setGamification(null)
      return undefined
    }

    async function loadGamification() {
      try {
        const data = await getGamificationMe()
        if (active) setGamification(data)
      } catch {
        // ignore if not applicable
      }
    }

    loadGamification()
    function handleUpdate() {
      loadGamification()
    }
    window.addEventListener('gamification-updated', handleUpdate)
    window.addEventListener('lesson-completed', handleUpdate)
    window.addEventListener('xp-earned', handleUpdate)
    return () => {
      active = false
      window.removeEventListener('gamification-updated', handleUpdate)
      window.removeEventListener('lesson-completed', handleUpdate)
      window.removeEventListener('xp-earned', handleUpdate)
    }
  }, [user])

  const streak = gamification?.streak_info?.current_streak ?? 0
  const xp = gamification?.total_xp ?? 0
  const level = gamification?.level_info?.current_level ?? 1

  // Persistent sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('kitsuno-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  const role = user?.role || ROLES.STUDENT
  const isStudent = role === ROLES.STUDENT
  const isInstructor = role === ROLES.INSTRUCTOR
  const isAdmin = role === ROLES.ADMIN
  const homePath = roleHomePath(role)

  useEffect(() => {
    try {
      localStorage.setItem('kitsuno-sidebar-collapsed', String(sidebarCollapsed))
    } catch (err) {
      console.error('Failed to persist sidebar collapse state:', err)
    }
  }, [sidebarCollapsed])

  // Close profile dropdown on click outside
  useEffect(() => {
    if (!profileDropdownOpen) return undefined

    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileDropdownOpen])

  // Close profile dropdown when navigating to a new route
  const prevPathnameRef = useRef(location.pathname)
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname
      setProfileDropdownOpen(false)
    }
  }, [location.pathname])

  // Clear hover timeout on unmount
  useEffect(() => {
    return () => {
      if (profileHoverTimeoutRef.current) {
        clearTimeout(profileHoverTimeoutRef.current)
      }
    }
  }, [])

  function toggleSidebarCollapse() {
    setSidebarCollapsed((prev) => !prev)
  }

  function handleNavClick() {
    setMobileMenuOpen(false)
  }

  const handleProfileMouseEnter = () => {
    if (profileHoverTimeoutRef.current) {
      clearTimeout(profileHoverTimeoutRef.current)
      profileHoverTimeoutRef.current = null
    }
    setProfileDropdownOpen(true)
  }

  const handleProfileMouseLeave = () => {
    profileHoverTimeoutRef.current = setTimeout(() => {
      setProfileDropdownOpen(false)
    }, 180)
  }

  const handleProfileClick = (e) => {
    e.preventDefault()
    setProfileDropdownOpen((prev) => !prev)
  }

  const handleProfileKeyDown = (e) => {
    if (e.key === 'Escape') {
      setProfileDropdownOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setProfileDropdownOpen((prev) => !prev)
    }
  }

  function openLogoutModal() {
    setProfileDropdownOpen(false)
    setLogoutModalOpen(true)
  }

  function confirmLogout() {
    setLogoutModalOpen(false)
    setProfileDropdownOpen(false)
    logout()
    navigate('/', { replace: true })
  }

  // Handle escape key to close confirmation modals
  useEffect(() => {
    function handleModalEscape(e) {
      if (e.key === 'Escape') {
        if (leaveModalOpen) setLeaveModalOpen(false)
        if (logoutModalOpen) setLogoutModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleModalEscape)
    return () => window.removeEventListener('keydown', handleModalEscape)
  }, [leaveModalOpen, logoutModalOpen])

  const analyticsPath = isStudent
    ? '/student/analytics'
    : isInstructor
      ? '/instructor/analytics'
      : '/admin/analytics'

  const userInitial = (user?.name || user?.email || 'U')[0].toUpperCase()

  // Render Avatar icon or image from user.avatar_url (single source of truth)
  function renderAvatar(sizeClass = 'h-8 w-8 text-xs') {
    const avatar = user?.avatar_url
    if (avatar) {
      if (avatar.startsWith('data:image') || avatar.startsWith('http') || avatar.startsWith('/uploads')) {
        return (
          <img
            src={avatar}
            alt={user?.name || 'User'}
            className={`${sizeClass} rounded-full object-cover border border-[var(--ks-border)] shrink-0`}
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
      const emoji = avatarEmojiMap[avatar]
      if (emoji) {
        return (
          <div className={`${sizeClass} shrink-0 flex items-center justify-center rounded-full bg-[#FDF1E6] border border-[var(--ks-border)] text-sm shadow-xs select-none`}>
            {emoji}
          </div>
        )
      }
    }
    return (
      <div className={`${sizeClass} shrink-0 flex items-center justify-center rounded-full bg-[var(--ks-orange)] font-bold text-white shadow-xs select-none`}>
        {userInitial}
      </div>
    )
  }

  const renderSidebar = (isCollapsed, isMobile = false) => (
    <div className="relative z-10 flex h-full flex-col justify-between text-[#24150F]">
      {/* ZONE 1: BRAND HEADER (~56px matching topbar) */}
      {!isCollapsed ? (
        <div className="flex h-14 shrink-0 items-center justify-between px-3.5 border-b-[1.5px] border-[#241A16]">
          <button
            type="button"
            onClick={() => setLeaveModalOpen(true)}
            className="flex items-center gap-2.5 min-w-0 transition-transform hover:scale-[1.01] focus-visible:outline-none cursor-pointer select-none text-left"
            title="Kitsuno.ai"
          >
            <img
              src="/logo1.png"
              alt="Kitsuno.ai"
              className="h-8 w-8 rounded-md object-contain shrink-0"
              draggable="false"
            />
            <div className="flex flex-col justify-center min-w-0 leading-none">
              <div className="flex items-center leading-none">
                <span
                  className="font-display text-[21px] font-normal tracking-tight text-[#241A16]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Kitsuno
                </span>
                <span
                  className="font-display text-[21px] font-normal tracking-tight text-[#F16524]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  .ai
                </span>
              </div>
              <span className="text-[8.5px] font-bold tracking-widest uppercase text-[#8F8177] leading-none mt-1">
                {isStudent ? 'STUDENT SPACE' : isInstructor ? 'INSTRUCTOR STUDIO' : 'ADMIN CONTROL'}
              </span>
            </div>
          </button>

          {!isMobile && (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="h-[28px] w-[28px] shrink-0 flex items-center justify-center rounded-[5px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] shadow-[1.5px_1.5px_0_#241A16] hover:bg-[#FFF2E6] hover:text-[#F16524] hover:border-[#F16524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5 stroke-[2]" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex h-14 shrink-0 items-center justify-between px-2 border-b-[1.5px] border-[#241A16]">
          <button
            type="button"
            onClick={() => setLeaveModalOpen(true)}
            className="flex h-7 w-7 items-center justify-center shrink-0 transition-transform hover:scale-105 cursor-pointer"
            title="Kitsuno.ai"
            aria-label="Kitsuno.ai"
          >
            <img
              src="/logo1.png"
              alt="Kitsuno.ai"
              className="h-full w-full object-contain rounded-md"
              draggable="false"
            />
          </button>

          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="h-[28px] w-[28px] shrink-0 flex items-center justify-center rounded-[5px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] shadow-[1.5px_1.5px_0_#241A16] hover:bg-[#FFF2E6] hover:text-[#F16524] hover:border-[#F16524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-3.5 w-3.5 stroke-[2]" />
          </button>
        </div>
      )}

      {/* ZONE 2: SCROLLABLE NAVIGATION */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2.5 space-y-2.5 scrollbar-thin">
        {/* SECTION 1: OVERVIEW */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <p className="ks-eyebrow text-[9px] px-2 mb-1.5">
              Overview
            </p>
          )}
          <SidebarNavItem
            to={homePath}
            icon={LayoutDashboard}
            label="Dashboard"
            currentPath={location.pathname}
            currentSearch={location.search}
            onClick={handleNavClick}
            collapsed={isCollapsed}
          />
          {isStudent && (
            <SidebarNavItem
              to="/student/study-plan"
              icon={CalendarCheck}
              label="Study Plan"
              currentPath={location.pathname}
              currentSearch={location.search}
              onClick={handleNavClick}
              collapsed={isCollapsed}
            />
          )}
          {!isStudent && (
            <SidebarNavItem
              to={analyticsPath}
              icon={BarChart3}
              label={isInstructor ? 'Course Analytics' : 'Global Analytics'}
              currentPath={location.pathname}
              currentSearch={location.search}
              onClick={handleNavClick}
              collapsed={isCollapsed}
            />
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#EAD8C7] my-2" />

        {/* SECTION 2: LEARN / STUDIO MANAGEMENT / ADMINISTRATION */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <p className="ks-eyebrow text-[9px] px-2 mb-1.5">
              {isStudent ? 'Learn' : isInstructor ? 'Studio Management' : 'Administration'}
            </p>
          )}

          {isStudent && (
            <>
              <SidebarNavItem
                to="/student/learning"
                icon={GraduationCap}
                label="My Learning"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/courses"
                icon={BookOpen}
                label="Explore Courses"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/ai-chat"
                icon={Sparkles}
                label="Ask Kitsuno AI"
                badge="AI"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/student/ai-search"
                icon={Search}
                label="AI Search"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/student/play"
                icon={Gamepad2}
                label="Play & Learn"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
            </>
          )}

          {isInstructor && (
            <>
              <SidebarNavItem
                to="/instructor/courses"
                icon={GraduationCap}
                label="My Courses"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/instructor/courses/new"
                icon={PlusCircle}
                label="Create Course"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/courses"
                icon={BookOpen}
                label="Explore Catalog"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
            </>
          )}

          {isAdmin && (
            <>
              <SidebarNavItem
                to="/instructor/courses"
                icon={GraduationCap}
                label="All Courses"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/instructor/courses/new"
                icon={PlusCircle}
                label="Create Course"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/admin/instructor-requests"
                icon={UserCheck}
                label="Instructor Requests"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/courses"
                icon={BookOpen}
                label="Explore Catalog"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
            </>
          )}
        </div>

        {/* SECTION 3: PRACTICE (Student only) */}
        {isStudent && (
          <>
            <div className="border-t border-[#EAD8C7] my-2" />
            <div className="space-y-0.5">
              {!isCollapsed && (
                <p className="ks-eyebrow text-[9px] px-2 mb-1.5">
                  Practice
                </p>
              )}
              <SidebarNavItem
                to="/student/quizzes"
                icon={ClipboardCheck}
                label="Quizzes"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/student/question-bank"
                icon={BrainCircuit}
                label="Question Bank"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/student/mock-exams"
                icon={GraduationCap}
                label="Mock Exams"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
            </div>
          </>
        )}

        {/* SECTION 4: PROGRESS (Student only) */}
        {isStudent && (
          <>
            <div className="border-t border-[#EAD8C7] my-2" />
            <div className="space-y-0.5">
              {!isCollapsed && (
                <p className="ks-eyebrow text-[9px] px-2 mb-1.5">
                  Progress
                </p>
              )}
              <SidebarNavItem
                to="/student/analytics"
                icon={BarChart3}
                label="Analytics"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/student/saved-content"
                icon={Bookmark}
                label="Saved Content"
                currentPath={location.pathname}
                currentSearch={location.search}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
            </div>
          </>
        )}
      </div>

      {/* ZONE 3: PINNED ACCOUNT SECTION */}
      <div className="shrink-0 border-t-[1.5px] border-[#241A16] px-2 py-2 bg-black/[0.02]">
        {!isCollapsed ? (
          <div className="space-y-1">
            <SidebarNavItem
              to="/settings"
              icon={Settings}
              label="Settings"
              currentPath={location.pathname}
              onClick={handleNavClick}
              collapsed={isCollapsed}
            />
            <SidebarNavItem
              to="/profile"
              icon={User}
              label="Profile"
              currentPath={location.pathname}
              onClick={handleNavClick}
              collapsed={isCollapsed}
            />
            <div className="pt-1.5 mt-1 border-t border-[#EAD8C7] flex items-center justify-between px-2 py-1.5 rounded-[6px] bg-white border-[1.5px] border-[#241A16] shadow-[2px_2px_0_#241A16]">
              <Link to="/profile" className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-90">
                {renderAvatar('h-7 w-7 text-xs')}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#241A16] truncate leading-tight">
                    {user?.name || user?.email?.split('@')[0] || 'Student'}
                  </p>
                  <p className="text-[10px] text-[#6F625B] capitalize truncate leading-none mt-0.5">
                    {user?.role || 'Student'}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={openLogoutModal}
                className="p-1.5 text-[#6F625B] hover:text-[#241A16] hover:bg-black/[0.04] rounded-md transition-colors cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-0.5">
            <SidebarNavItem
              to="/settings"
              icon={Settings}
              label="Settings"
              currentPath={location.pathname}
              onClick={handleNavClick}
              collapsed={true}
            />
            <SidebarNavItem
              to="/profile"
              icon={User}
              label="Profile"
              currentPath={location.pathname}
              onClick={handleNavClick}
              collapsed={true}
            />
            <div className="w-6 border-t border-[#EAD8C7] my-0.5" />
            <div className="group relative">
              <button
                type="button"
                onClick={openLogoutModal}
                className="flex items-center justify-center h-9 w-9 text-[#6F625B] hover:text-[#24150F] hover:bg-black/[0.04] rounded-[6px] transition-colors cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 rounded-[5px] border-[1.5px] border-[#241A16] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#241A16] shadow-[2px_2px_0_#241A16] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Sign out
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--ks-bg)] text-[var(--ks-text)] font-sans flex flex-col lg:flex-row relative">
      {/* Desktop Sticky Collapsible Sidebar (250px expanded, 74px collapsed) */}
      <aside
        className={`hidden lg:flex flex-col sticky top-0 h-screen z-30 shrink-0 border-r-[1.5px] border-[#241A16] ks-sidebar-grain transition-[width] duration-200 ease-in-out shadow-xs ${
          sidebarCollapsed ? 'w-[74px]' : 'w-[250px]'
        }`}
      >
        {renderSidebar(sidebarCollapsed, false)}
      </aside>

      {/* Mobile Drawer (260px overlay drawer with backdrop blur) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[#1F0E04]/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-[260px] ks-sidebar-grain border-r-[1.5px] border-[#241A16] z-50 shadow-2xl flex flex-col h-full">
            <div className="absolute top-3.5 right-3 z-20">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-[#6F625B] hover:text-[#24150F] hover:bg-black/[0.04] rounded-md transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderSidebar(false, true)}
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col w-full">
        {/* Top Editorial Navbar */}
        <header className="sticky top-0 z-20 flex h-16 sm:h-[68px] items-center justify-between border-b-[1.5px] border-[#241A16] bg-white px-3 sm:px-6 lg:px-8 w-full shadow-[0_2px_0_rgba(36,26,22,0.06)]">
          {/* Left: Mobile menu toggle & Prominent Search Input */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2 sm:mr-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-10 w-10 shrink-0 flex items-center justify-center rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] shadow-[2px_2px_0_#241A16] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#241A16] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Prominent Search Bar (460px desktop width) */}
            <div className="relative w-full max-w-[460px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6F625B] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/student/ai-search?q=${encodeURIComponent(searchQuery.trim())}`)
                  }
                }}
                placeholder="Search courses, lessons, quizzes, or concepts..."
                className="w-full h-10 rounded-[6px] border-[1.5px] border-[#241A16] bg-white pl-9 sm:pl-10 pr-10 sm:pr-14 text-xs font-medium text-[#241A16] placeholder-[#6F625B]/70 shadow-[2px_2px_0_#241A16] outline-none transition-all focus:border-[#F16524]"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-[4px] border border-[#241A16]/30 bg-[#FFF8F3] px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#241A16]">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right: Streak, XP, Notifications, Separator & Profile Info */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Gamification Streak, XP & Level Badges (Student only) */}
            {isStudent && (
              <div className="hidden sm:flex items-center gap-2">
                {/* Streak Badge Button */}
                <button
                  type="button"
                  onClick={() => setStreakModalOpen(true)}
                  title={`${streak} consecutive study days · Click for Streak Details`}
                  className="inline-flex items-center gap-1.5 h-10 px-2.5 sm:px-3 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-xs font-semibold text-[#241A16] shadow-[2px_2px_0_#241A16] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#241A16] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group select-none"
                >
                  <Flame className="h-4 w-4 text-[#F16524] fill-[#F16524]/20 group-hover:scale-110 transition-transform" />
                  <span>{streak} {streak === 1 ? 'day' : 'days'}</span>
                </button>

                {/* XP Badge Button */}
                <button
                  type="button"
                  onClick={() => setXpModalOpen(true)}
                  title={`Level ${level} · ${xp} total XP · Click for XP & Rewards`}
                  className="inline-flex items-center gap-1.5 h-10 px-2.5 sm:px-3 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-xs font-bold text-[#F16524] shadow-[2px_2px_0_#241A16] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#241A16] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group select-none"
                >
                  <Zap className="h-4 w-4 text-[#F16524] fill-[#F16524] group-hover:scale-110 transition-transform" />
                  <span>{xp} XP</span>
                </button>

                {/* Level Badge Button */}
                <button
                  type="button"
                  onClick={() => setLevelModalOpen(true)}
                  title={`Level ${level} · Click for Level Progression Roadmap`}
                  className="inline-flex items-center gap-1.5 h-10 px-2.5 sm:px-3 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-xs font-semibold text-[#241A16] shadow-[2px_2px_0_#241A16] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#241A16] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group select-none"
                >
                  <Award className="h-4 w-4 text-[#241A16] group-hover:scale-110 transition-transform" />
                  <span>Lv {level}</span>
                </button>
              </div>
            )}

            {/* Role / Workspace Context Badge (Instructor & Admin) */}
            {!isStudent && (
              <div className="hidden sm:flex items-center">
                <span className="inline-flex items-center h-10 px-3 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[11px] font-mono font-bold uppercase tracking-wider text-[#241A16] shadow-[2px_2px_0_#241A16]">
                  {isInstructor ? 'Instructor Studio' : 'Admin Workspace'}
                </span>
              </div>
            )}

            {/* Notification bell & In-App Notification Center */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative h-10 w-10 flex items-center justify-center shrink-0 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] shadow-[2px_2px_0_#241A16] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#241A16] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#F16524] border border-[#241A16]" />
                )}
              </button>

              <NotificationsPanel
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                onUnreadCountChange={setUnreadNotifications}
              />
            </div>

            {/* Vertical separator */}
            <div className="hidden sm:block h-6 w-[1.5px] bg-[#241A16]/20 mx-0.5" />

            {/* Profile User Info & Dropdown */}
            <div
              ref={profileMenuRef}
              className="relative"
              onMouseEnter={handleProfileMouseEnter}
              onMouseLeave={handleProfileMouseLeave}
            >
              <button
                type="button"
                onClick={handleProfileClick}
                onKeyDown={handleProfileKeyDown}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="menu"
                aria-label="User profile menu"
                className="flex items-center gap-2 sm:gap-2.5 h-10 px-2 sm:px-2.5 rounded-[6px] border-[1.5px] border-[#241A16] bg-white text-[#241A16] shadow-[2px_2px_0_#241A16] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#241A16] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-left select-none shrink-0"
              >
                {renderAvatar('h-7 w-7 text-xs')}
                <div className="hidden sm:flex flex-col text-left leading-none">
                  <span className="text-xs font-semibold text-[#241A16] leading-tight truncate max-w-[100px]">
                    {user?.name || 'User'}
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#6F625B] mt-0.5">
                    {role}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 top-full mt-2 w-64 rounded-md border-[1.5px] border-[#241A16] bg-white p-2 shadow-[3px_4px_0_#241A16] z-50 before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-['']"
                >
                  {/* Identity Header */}
                  <div className="px-2.5 py-2">
                    <div className="flex items-center gap-2.5">
                      {renderAvatar('h-8 w-8 text-xs')}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-xs font-bold text-[var(--ks-text)] leading-tight">
                          {user?.name || user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ks-orange)]">
                          {role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="my-1 border-t border-[var(--ks-border)]" />

                  {/* Account Section */}
                  <div className="py-0.5">
                    <p className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--ks-text-subtle)]">
                      Account
                    </p>
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--ks-text)] hover:bg-[var(--ks-surface-soft)] hover:text-[var(--ks-orange)] transition-colors group"
                    >
                      <User className="h-3.5 w-3.5 text-[var(--ks-text-muted)] group-hover:text-[var(--ks-orange)] shrink-0 transition-colors" strokeWidth={1.8} />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--ks-text)] hover:bg-[var(--ks-surface-soft)] hover:text-[var(--ks-orange)] transition-colors group"
                    >
                      <Settings className="h-3.5 w-3.5 text-[var(--ks-text-muted)] group-hover:text-[var(--ks-orange)] shrink-0 transition-colors" strokeWidth={1.8} />
                      <span>Settings</span>
                    </Link>
                  </div>

                  <div className="my-1 border-t border-[var(--ks-border)]" />

                  {/* Support Section */}
                  <div className="py-0.5">
                    <p className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--ks-text-subtle)]">
                      Support
                    </p>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        setNotificationsOpen(true)
                      }}
                      className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--ks-text)] hover:bg-[var(--ks-surface-soft)] hover:text-[var(--ks-orange)] transition-colors text-left group"
                    >
                      <Bell className="h-3.5 w-3.5 text-[var(--ks-text-muted)] group-hover:text-[var(--ks-orange)] shrink-0 transition-colors" strokeWidth={1.8} />
                      <span>Notifications</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        setHelpOpen(true)
                      }}
                      className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--ks-text)] hover:bg-[var(--ks-surface-soft)] hover:text-[var(--ks-orange)] transition-colors text-left group"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-[var(--ks-text-muted)] group-hover:text-[var(--ks-orange)] shrink-0 transition-colors" strokeWidth={1.8} />
                      <span>Help & FAQ</span>
                    </button>
                  </div>

                  <div className="my-1 border-t border-[var(--ks-border)]" />

                  {/* Actions Section */}
                  <div className="py-0.5">
                    <p className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--ks-text-subtle)]">
                      Actions
                    </p>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={openLogoutModal}
                      className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--ks-text)] hover:bg-[rgba(241,101,36,0.08)] hover:text-[var(--ks-orange)] transition-colors text-left group cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5 text-[var(--ks-text-muted)] group-hover:text-[var(--ks-orange)] shrink-0 transition-colors" strokeWidth={1.8} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1280px] mx-auto">
          {children}
        </main>
      </div>

      {/* Leave Dashboard Confirmation Modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#241A16]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setLeaveModalOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-modal-title"
            className="relative w-full max-w-sm rounded-lg border-[2px] border-[#241A16] bg-white p-6 shadow-[4px_5px_0_#241A16] z-50 space-y-4 text-[#241A16]"
          >
            <div className="space-y-2">
              <h3 id="leave-modal-title" className="font-serif text-2xl font-normal text-[#241A16]">
                Leave Student Dashboard?
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Do you want to go back to the Kitsuno home page?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLeaveModalOpen(false)}
                className="ks-neo-btn-secondary px-3.5 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaveModalOpen(false)
                  navigate('/')
                }}
                className="ks-neo-btn-primary px-3.5 py-1.5 text-xs"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#241A16]/50 backdrop-blur-xs transition-opacity"
            onClick={() => setLogoutModalOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            className="relative w-full max-w-sm rounded-lg border-[2px] border-[#241A16] bg-white p-6 shadow-[4px_5px_0_#241A16] z-50 space-y-4 text-[#241A16]"
          >
            <div className="space-y-2">
              <h3 id="logout-modal-title" className="font-serif text-2xl font-normal text-[#241A16]">
                Log out?
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Are you sure you want to log out of Kitsuno.ai?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="ks-neo-btn-secondary px-3.5 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="ks-neo-btn-primary px-3.5 py-1.5 text-xs"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#241A16]/30 transition-opacity"
            onClick={() => setHelpOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-[8px] border-[2px] border-[#241A16] bg-white p-6 shadow-[4px_5px_0_#241A16] z-50 text-[#241A16]">
            <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-[#241A16]">
              <h3 className="font-serif text-xl font-normal text-[#241A16]">Help & Documentation</h3>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="p-1 text-neutral-500 hover:text-[#241A16] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-neutral-600 leading-relaxed">
              <p>
                <strong className="text-[#241A16]">Curriculum & Courses:</strong> Manage your enrolled or authored modules and lessons.
              </p>
              <p>
                <strong className="text-[#241A16]">AI Quiz Generator:</strong> Instructors can synthesize calibrated quizzes from syllabus notes.
              </p>
              <p>
                Support email: <a href="mailto:contact@kitsuno.ai" className="text-[#F16524] font-semibold hover:underline">contact@kitsuno.ai</a>
              </p>
            </div>
            <div className="mt-5 pt-3 border-t-[1.5px] border-[#241A16] text-right">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="ks-neo-btn-primary px-3.5 py-1.5 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Header & Dashboard Modals */}
      <StreakDetailsModal
        isOpen={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
      />
      <XpRewardsModal
        isOpen={xpModalOpen}
        onClose={() => setXpModalOpen(false)}
      />
      <LevelProgressModal
        isOpen={levelModalOpen}
        onClose={() => setLevelModalOpen(false)}
      />
    </div>
  )
}