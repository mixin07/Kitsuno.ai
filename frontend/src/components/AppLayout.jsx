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
  Target,
  ClipboardCheck,
  Layers,
  Trophy,
  Medal,
  Award,
  Flame,
  Gamepad2,
  User,
  HelpCircle,
  LogOut,
} from 'lucide-react'
import { ROLES, roleHomePath } from '../constants/roles.js'
import { useAuth } from '../hooks/useAuth.js'
import { getGamificationMe } from '../services/gamificationService.js'

function isRouteActive(to, pathname) {
  if (!to || !pathname) return false

  const normPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const normTo = to.length > 1 && to.endsWith('/') ? to.slice(0, -1) : to

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

  // 3. /student owns student quiz execution pages /student/quiz/...
  if (normTo === '/student') {
    return normPath.startsWith('/student/quiz')
  }

  // 4. /student/play owns all game routes under /student/play/
  if (normTo === '/student/play') {
    return normPath.startsWith('/student/play')
  }

  return false
}

function SidebarNavItem({ to, icon: Icon, label, currentPath, onClick, badge, collapsed, disabled }) {
  const active = !disabled && isRouteActive(to, currentPath)

  if (disabled) {
    return (
      <div className="group relative">
        <div
          className={`relative flex items-center ${
            collapsed ? 'justify-center px-2 py-1.5' : 'justify-between px-2.5 py-1.5'
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
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 rounded-md bg-[#24150F] px-2.5 py-1 text-[11px] font-medium text-white shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
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
        className={`relative flex items-center ${
          collapsed ? 'justify-center px-2 py-1.5' : 'justify-between px-2.5 py-1.5'
        } rounded-lg text-sm transition-all duration-150 ${
          active
            ? 'bg-white text-[#24150F] font-semibold shadow-xs border border-[#EAD8C7]'
            : 'text-[#6F625B] hover:bg-black/[0.04] hover:text-[#24150F] font-medium'
        }`}
      >
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
          {/* Active Indicator: 3px orange vertical pill on left edge */}
          {active && (
            <span
              className="absolute left-1 top-1/2 -translate-y-1/2 h-3.5 w-1 rounded-full bg-[#F06424]"
              aria-hidden="true"
            />
          )}
          <Icon
            className={`h-4 w-4 shrink-0 transition-colors ${
              active ? 'text-[#F06424]' : 'text-[#8F8177] group-hover:text-[#24150F]'
            }`}
            strokeWidth={active ? 2.2 : 1.7}
          />
          {!collapsed && <span className="truncate tracking-tight text-[13px]">{label}</span>}
        </div>
        {!collapsed && badge && (
          <span
            className={`rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase ${
              active
                ? 'bg-[#F06424]/10 text-[#F06424]'
                : 'bg-[#EAD8C7]/70 text-[#6F625B]'
            }`}
          >
            {badge}
          </span>
        )}
      </Link>

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 rounded-md bg-[#24150F] px-2.5 py-1 text-[11px] font-medium text-white shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
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
  const [unreadNotifications, _setUnreadNotifications] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const profileHoverTimeoutRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  const renderSidebar = (isCollapsed) => (
    <div className="relative z-10 flex h-full flex-col justify-between text-[#24150F]">
      {/* ZONE 1: BRAND HEADER (~56px matching topbar) */}
      {!isCollapsed ? (
        <div className="flex h-14 shrink-0 items-center px-4 border-b border-[#EAD8C7]">
          <button
            type="button"
            onClick={() => setLeaveModalOpen(true)}
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.01] focus-visible:outline-none cursor-pointer select-none text-left"
            title="Kitsuno.ai"
          >
            <img
              src="/logo1.png"
              alt="Kitsuno.ai"
              className="h-8 w-8 rounded-md object-contain shrink-0"
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
          </button>
        </div>
      ) : (
        <div className="flex h-14 shrink-0 items-center justify-center px-2.5 border-b border-[#EAD8C7]">
          <button
            type="button"
            onClick={() => setLeaveModalOpen(true)}
            className="flex h-8 w-8 items-center justify-center shrink-0 transition-transform hover:scale-105 cursor-pointer"
            title="Kitsuno.ai"
          >
            <img
              src="/logo1.png"
              alt="Kitsuno.ai"
              className="h-full w-full object-contain rounded-md"
              draggable="false"
            />
          </button>
        </div>
      )}

      {/* ZONE 2: SCROLLABLE NAVIGATION */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2.5 space-y-2.5 scrollbar-thin">
        {/* SECTION 1: OVERVIEW */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <p className="px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#A2958D] mb-1">
              Overview
            </p>
          )}
          <SidebarNavItem
            to={homePath}
            icon={LayoutDashboard}
            label="Dashboard"
            currentPath={location.pathname}
            onClick={handleNavClick}
            collapsed={isCollapsed}
          />
          {isStudent && (
            <SidebarNavItem
              to="/student/learning"
              icon={GraduationCap}
              label="My Learning"
              currentPath={location.pathname}
              onClick={handleNavClick}
              collapsed={isCollapsed}
            />
          )}
          <SidebarNavItem
            to={analyticsPath}
            icon={BarChart3}
            label={isInstructor ? 'Course Analytics' : isAdmin ? 'Global Analytics' : 'Analytics'}
            currentPath={location.pathname}
            onClick={handleNavClick}
            collapsed={isCollapsed}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-[#EAD8C7] my-2" />

        {/* SECTION 2: LEARN / STUDIO MANAGEMENT / ADMINISTRATION */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <p className="px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#A2958D] mb-1">
              {isStudent ? 'Learn' : isInstructor ? 'Studio Management' : 'Administration'}
            </p>
          )}

          {isStudent && (
            <>
              <SidebarNavItem
                to="/courses"
                icon={BookOpen}
                label="Course Catalog"
                currentPath={location.pathname}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/ai-chat"
                icon={Sparkles}
                label="Ask Kitsuno"
                badge="AI"
                currentPath={location.pathname}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/student/play"
                icon={Gamepad2}
                label="Play & Learn"
                currentPath={location.pathname}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="#"
                icon={Target}
                label="Study Plan"
                collapsed={isCollapsed}
                disabled
              />
              <SidebarNavItem
                to="#"
                icon={Search}
                label="AI Search"
                collapsed={isCollapsed}
                disabled
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
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/instructor/courses/new"
                icon={PlusCircle}
                label="Create Course"
                currentPath={location.pathname}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/courses"
                icon={BookOpen}
                label="Explore Catalog"
                currentPath={location.pathname}
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
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/instructor/courses/new"
                icon={PlusCircle}
                label="Create Course"
                currentPath={location.pathname}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
              <SidebarNavItem
                to="/courses"
                icon={BookOpen}
                label="Explore Catalog"
                currentPath={location.pathname}
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
                <p className="px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#A2958D] mb-1">
                  Practice
                </p>
              )}
              <SidebarNavItem
                to="#"
                icon={ClipboardCheck}
                label="Quizzes"
                collapsed={isCollapsed}
                disabled
              />
              <SidebarNavItem
                to="#"
                icon={GraduationCap}
                label="Mock Exams"
                collapsed={isCollapsed}
                disabled
              />
              <SidebarNavItem
                to="#"
                icon={Layers}
                label="Flashcards"
                collapsed={isCollapsed}
                disabled
              />
              <SidebarNavItem
                to="#"
                icon={BrainCircuit}
                label="Question Bank"
                collapsed={isCollapsed}
                disabled
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
                <p className="px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#A2958D] mb-1">
                  Progress
                </p>
              )}
              <SidebarNavItem
                to="#"
                icon={Trophy}
                label="Achievements"
                collapsed={isCollapsed}
                disabled
              />
              <SidebarNavItem
                to="#"
                icon={Medal}
                label="Leaderboard"
                collapsed={isCollapsed}
                disabled
              />
              <SidebarNavItem
                to="#"
                icon={Flame}
                label="Study Streak"
                collapsed={isCollapsed}
                disabled
              />
              <SidebarNavItem
                to="#"
                icon={Award}
                label="Certificates"
                collapsed={isCollapsed}
                disabled
              />
            </div>
          </>
        )}
      </div>

      {/* ZONE 3: PINNED ACCOUNT SECTION */}
      <div className="shrink-0 border-t border-[#EAD8C7] px-2 py-2 bg-black/[0.02]">
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
            <div className="pt-1.5 mt-1 border-t border-[#EAD8C7] flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/70 border border-[#EAD8C7] shadow-2xs">
              <Link to="/profile" className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-90">
                {renderAvatar('h-7 w-7 text-xs')}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#24150F] truncate leading-tight">
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
                className="p-1.5 text-[#6F625B] hover:text-[#24150F] hover:bg-black/[0.04] rounded-md transition-colors cursor-pointer"
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
            <button
              type="button"
              onClick={openLogoutModal}
              className="p-1.5 text-[#6F625B] hover:text-[#24150F] hover:bg-black/[0.04] rounded-md transition-colors cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--ks-bg)] text-[var(--ks-text)] font-sans flex flex-col lg:flex-row relative">
      {/* Desktop Sticky Collapsible Sidebar (250px expanded, 70px collapsed) */}
      <aside
        className={`hidden lg:flex flex-col sticky top-0 h-screen z-30 shrink-0 border-r border-[#EAD8C7] ks-sidebar-grain transition-[width] duration-200 ease-in-out shadow-xs ${
          sidebarCollapsed ? 'w-[70px]' : 'w-[250px]'
        }`}
      >
        {renderSidebar(sidebarCollapsed)}
      </aside>

      {/* Mobile Drawer (260px overlay drawer with backdrop blur) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[#1F0E04]/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-[260px] ks-sidebar-grain border-r border-[#EAD8C7] z-50 shadow-2xl flex flex-col h-full">
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
            {renderSidebar(false)}
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col w-full">
        {/* Top Editorial Navbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--ks-border)] bg-[var(--ks-surface)] px-4 sm:px-6 lg:px-8 w-full">
          {/* Left: Mobile menu toggle, Desktop Sidebar toggle & Prominent Search Input */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-[var(--ks-text-muted)] hover:text-[var(--ks-text)] rounded-md hover:bg-black/[0.04]"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex items-center justify-center p-1.5 text-[#6F625B] hover:text-[#24150F] hover:bg-black/[0.04] rounded-md transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            {/* Prominent Search Bar (460px desktop width) */}
            <div className="relative w-full max-w-[460px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ks-text-subtle)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, quizzes, analytics..."
                className="w-full h-9 rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] pl-9 pr-12 text-xs text-[var(--ks-text)] placeholder-[var(--ks-text-subtle)] outline-none transition-colors focus:border-[var(--ks-orange)] focus:bg-[var(--ks-surface)]"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--ks-border)] bg-[var(--ks-surface)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--ks-text-subtle)]">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right: Streak, XP, Notifications, Separator & Profile Info */}
          <div className="flex items-center gap-3">
            {/* Gamification Streak & Level Badges (Student only) */}
            {isStudent && (
              <div className="hidden sm:flex items-center gap-2">
                <span
                  title={`${streak} consecutive study days`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--ks-text)]"
                >
                  <span>🔥</span>
                  <span>{streak} {streak === 1 ? 'day' : 'days'}</span>
                </span>
                <span
                  title={`Level ${level} · ${xp} total XP`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ks-orange)]/25 bg-[rgba(241,101,36,0.08)] px-2.5 py-1 text-xs font-bold text-[var(--ks-orange)]"
                >
                  <span>⚡</span>
                  <span>{xp} XP</span>
                </span>
              </div>
            )}

            {/* Role / Workspace Context Badge (Instructor & Admin) */}
            {!isStudent && (
              <div className="hidden sm:flex items-center">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ks-text-muted)]">
                  {isInstructor ? 'Instructor Studio' : 'Admin Workspace'}
                </span>
              </div>
            )}

            {/* Notification bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-1.5 text-[var(--ks-text-muted)] transition-colors hover:text-[var(--ks-text)]"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--ks-orange)]" />
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface)] p-3 shadow-md z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--ks-border)]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ks-text)]">
                        Notifications
                      </span>
                      <span className="text-[10px] text-[var(--ks-text-subtle)]">Live</span>
                    </div>
                    <div className="py-4 text-center">
                      <p className="text-xs text-[var(--ks-text-muted)]">No new notifications</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Vertical separator */}
            <div className="h-4 w-px bg-[var(--ks-border)]" />

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
                className="flex items-center gap-2.5 rounded-md p-1 transition-colors hover:bg-[var(--ks-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-orange)] cursor-pointer text-left select-none"
              >
                {renderAvatar('h-7 w-7 text-xs')}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[var(--ks-text)] leading-tight">
                    {user?.name || 'User'}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--ks-text-subtle)]">
                    {role}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 top-full mt-2 w-64 rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface)] p-2 shadow-lg z-50 before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-['']"
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
            className="relative w-full max-w-sm rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-2xl z-50 space-y-4"
          >
            <div className="space-y-2">
              <h3 id="leave-modal-title" className="font-serif text-lg font-bold text-[var(--ks-text)]">
                Leave Student Dashboard?
              </h3>
              <p className="text-xs text-[var(--ks-text-muted)] leading-relaxed">
                Do you want to go back to the Kitsuno home page?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLeaveModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--ks-border)] text-xs font-semibold text-[var(--ks-text)] hover:bg-[var(--ks-surface-soft)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaveModalOpen(false)
                  navigate('/')
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--ks-orange)] text-white text-xs font-semibold hover:bg-[var(--ks-orange-hover)] transition-colors shadow-xs cursor-pointer"
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
            className="fixed inset-0 bg-[#241A16]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setLogoutModalOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            className="relative w-full max-w-sm rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-2xl z-50 space-y-4"
          >
            <div className="space-y-2">
              <h3 id="logout-modal-title" className="font-serif text-lg font-bold text-[var(--ks-text)]">
                Log out?
              </h3>
              <p className="text-xs text-[var(--ks-text-muted)] leading-relaxed">
                Are you sure you want to log out of Kitsuno.ai?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--ks-border)] text-xs font-semibold text-[var(--ks-text)] hover:bg-[var(--ks-surface-soft)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--ks-orange)] text-white text-xs font-semibold hover:bg-[var(--ks-orange-hover)] transition-colors shadow-xs cursor-pointer"
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
          <div className="relative w-full max-w-md rounded-md border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 shadow-xl z-50">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ks-border)]">
              <h3 className="font-display text-lg text-[var(--ks-text)]">Help & Documentation</h3>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="p-1 text-[var(--ks-text-muted)] hover:text-[var(--ks-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-[var(--ks-text-muted)] leading-relaxed">
              <p>
                <strong className="text-[var(--ks-text)]">Curriculum & Courses:</strong> Manage your enrolled or authored modules and lessons.
              </p>
              <p>
                <strong className="text-[var(--ks-text)]">AI Quiz Generator:</strong> Instructors can synthesize calibrated quizzes from syllabus notes.
              </p>
              <p>
                Support email: <a href="mailto:contact@kitsuno.ai" className="text-[var(--ks-orange)] font-semibold hover:underline">contact@kitsuno.ai</a>
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--ks-border)] text-right">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded-md bg-[var(--ks-orange)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ks-orange-light)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}