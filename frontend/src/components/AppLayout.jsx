import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  BarChart3,
  GraduationCap,
  Bookmark,
  Sparkles,
  ShieldCheck,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Menu,
  X,
} from 'lucide-react'
import { ROLES, roleHomePath } from '../constants/roles.js'
import { useAuth } from '../hooks/useAuth.js'

function getGreeting(name) {
  const hour = new Date().getHours()
  let prefix = 'Good morning'
  if (hour >= 12 && hour < 17) prefix = 'Good afternoon'
  else if (hour >= 17) prefix = 'Good evening'
  return `${prefix}, ${name || 'Learner'}`
}

function isRouteActive(to, pathname) {
  if (to === '/student') {
    return pathname === '/student' || pathname.startsWith('/student/quiz')
  }
  if (to === '/instructor') {
    return pathname === '/instructor'
  }
  if (to === '/instructor/courses') {
    return pathname === '/instructor/courses' || pathname.startsWith('/instructor/courses/')
  }
  if (to === '/instructor/ai-quiz-generator') {
    return pathname === '/instructor/ai-quiz-generator'
  }
  if (to === '/courses') {
    return pathname === '/courses' || (pathname.startsWith('/courses/') && !pathname.startsWith('/instructor'))
  }
  if (to === '/student/analytics') {
    return pathname === '/student/analytics'
  }
  if (to === '/instructor/analytics') {
    return pathname === '/instructor/analytics'
  }
  if (to === '/admin') {
    return pathname === '/admin'
  }
  if (to === '/admin/analytics') {
    return pathname === '/admin/analytics'
  }
  return pathname === to
}

function SidebarNavItem({ to, icon: Icon, label, currentPath, onClick, badge }) {
  const active = isRouteActive(to, currentPath)
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-[rgba(241,101,36,0.1)] text-[var(--ks-text)] font-semibold shadow-xs'
          : 'text-[var(--ks-text-muted)] hover:bg-[rgba(90,55,30,0.05)] hover:text-[var(--ks-text)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-5 w-5 items-center justify-center transition-colors ${
            active ? 'text-[var(--ks-orange)]' : 'text-[var(--ks-text-muted)] group-hover:text-[var(--ks-text)]'
          }`}
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.2 : 1.8} />
        </span>
        <span className="truncate">{label}</span>
      </div>
      {badge && (
        <span className="rounded-full bg-[rgba(241,101,36,0.15)] px-2 py-0.5 text-[10px] font-bold text-[var(--ks-orange)]">
          {badge}
        </span>
      )}
      {active && (
        <span
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--ks-orange)]"
          aria-hidden="true"
        />
      )}
    </Link>
  )
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  function handleNavClick() {
    setMobileMenuOpen(false)
  }

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  const role = user?.role || ROLES.STUDENT
  const isStudent = role === ROLES.STUDENT
  const isInstructor = role === ROLES.INSTRUCTOR
  const isAdmin = role === ROLES.ADMIN
  const homePath = roleHomePath(role)

  const analyticsPath = isStudent
    ? '/student/analytics'
    : isInstructor
      ? '/instructor/analytics'
      : '/admin/analytics'

  const quizzesPath = isInstructor || isAdmin ? '/instructor/ai-quiz-generator' : '/courses'

  // Subtitle context
  let subtext = 'Continue where you left off and keep your learning moving.'
  if (isInstructor) {
    subtext = 'Manage your courses, track learner engagement, and generate AI quizzes.'
  } else if (isAdmin) {
    subtext = 'Monitor system operations, user activities, and course analytics.'
  }

  const userInitial = (user?.name || user?.email || 'U')[0].toUpperCase()

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand Link (NO WHITE HALO - Direct logo image fills container) */}
        <Link
          to="/"
          className="flex items-center gap-3 px-2 py-1 transition-opacity hover:opacity-90 focus-visible:outline-none"
        >
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[rgba(241,101,36,0.25)] bg-[var(--ks-surface-soft)] shadow-xs">
            <img
              src="/logo1.png"
              alt="Kitsuno.ai"
              className="h-full w-full object-cover"
              draggable="false"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-normal leading-none tracking-tight text-[var(--ks-text)]">
              Kitsuno<span className="text-[var(--ks-orange)]">.ai</span>
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ks-text-subtle)]">
              Learning System
            </span>
          </div>
        </Link>

        {/* Navigation Section: OVERVIEW */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-subtle)]">
            Overview
          </p>
          <div className="mt-2 space-y-1">
            <SidebarNavItem
              to={homePath}
              icon={LayoutDashboard}
              label="Dashboard"
              currentPath={location.pathname}
              onClick={handleNavClick}
            />
            <SidebarNavItem
              to="/courses"
              icon={BookOpen}
              label="Courses"
              currentPath={location.pathname}
              onClick={handleNavClick}
            />
            <SidebarNavItem
              to={quizzesPath}
              icon={BrainCircuit}
              label={isInstructor || isAdmin ? 'AI Quiz Engine' : 'Quizzes'}
              currentPath={location.pathname}
              badge={isInstructor || isAdmin ? 'AI' : undefined}
              onClick={handleNavClick}
            />
            <SidebarNavItem
              to={analyticsPath}
              icon={BarChart3}
              label="Analytics"
              currentPath={location.pathname}
              onClick={handleNavClick}
            />
          </div>
        </div>

        {/* Navigation Section: ROLE-SPECIFIC */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ks-text-subtle)]">
            {isStudent ? 'Learning' : isInstructor ? 'Instructor Studio' : 'Administration'}
          </p>
          <div className="mt-2 space-y-1">
            {isStudent && (
              <>
                <SidebarNavItem
                  to="/student"
                  icon={GraduationCap}
                  label="My Courses"
                  currentPath={location.pathname}
                  onClick={handleNavClick}
                />
                <SidebarNavItem
                  to="/courses"
                  icon={Bookmark}
                  label="Explore Catalog"
                  currentPath={location.pathname}
                  onClick={handleNavClick}
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
                />
                <SidebarNavItem
                  to="/instructor/ai-quiz-generator"
                  icon={Sparkles}
                  label="AI Quiz Generator"
                  currentPath={location.pathname}
                  badge="Generator"
                  onClick={handleNavClick}
                />
              </>
            )}

            {isAdmin && (
              <>
                <SidebarNavItem
                  to="/admin"
                  icon={ShieldCheck}
                  label="System Admin"
                  currentPath={location.pathname}
                  onClick={handleNavClick}
                />
                <SidebarNavItem
                  to="/instructor/courses"
                  icon={GraduationCap}
                  label="All Courses"
                  currentPath={location.pathname}
                  onClick={handleNavClick}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Settings & User Profile */}
      <div className="space-y-3 pt-4 border-t border-[var(--ks-border)]">
        <div className="space-y-1">
          <Link
            to="/profile"
            onClick={handleNavClick}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-[var(--ks-text-muted)] transition hover:bg-[rgba(90,55,30,0.05)] hover:text-[var(--ks-text)]"
          >
            <Settings className="h-4 w-4" />
            <span>Profile & Settings</span>
          </Link>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-[var(--ks-text-muted)] transition hover:bg-[rgba(90,55,30,0.05)] hover:text-[var(--ks-text)]"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Help & FAQ</span>
          </button>
        </div>

        {/* User Card (Links to real /profile) */}
        <div className="group flex items-center justify-between rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface-soft)] p-2.5 transition hover:border-[var(--ks-orange)]/40">
          <Link
            to="/profile"
            onClick={handleNavClick}
            className="flex items-center gap-2.5 overflow-hidden flex-1"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ks-orange)] font-bold text-white text-xs shadow-xs">
              {userInitial}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="truncate text-xs font-bold text-[var(--ks-text)] group-hover:text-[var(--ks-orange)] transition-colors">
                {user?.name || 'Kitsuno User'}
              </span>
              <span className="text-[10px] font-medium text-[var(--ks-text-muted)]">
                {role}
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="rounded-lg p-1.5 text-[var(--ks-text-muted)] transition hover:bg-[rgba(241,101,36,0.1)] hover:text-[var(--ks-orange)] focus-visible:outline-none"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--ks-bg)] text-[var(--ks-text)] font-sans flex">
      {/* Desktop Left Sidebar (Fixed) */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-40 border-r border-[var(--ks-border)] bg-[var(--ks-surface)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[#241A16]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[var(--ks-surface)] shadow-2xl z-50">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-[var(--ks-text-muted)] hover:bg-[var(--ks-bg-soft)]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area (Offset by sidebar on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--ks-border)] bg-[var(--ks-surface)]/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
          {/* Left: Mobile Toggle & Greeting */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden rounded-lg p-1.5 text-[var(--ks-text-muted)] hover:bg-[var(--ks-bg-soft)] focus-visible:outline-none"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <h1 className="font-display text-lg sm:text-xl font-normal tracking-tight text-[var(--ks-text)]">
                {getGreeting(user?.name)}
              </h1>
              <p className="hidden sm:block text-xs text-[var(--ks-text-muted)]">
                {subtext}
              </p>
            </div>
          </div>

          {/* Right: Notifications & Profile Pill */}
          <div className="relative flex items-center gap-3 sm:gap-4">
            {/* Notifications Button & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-2 text-[var(--ks-text-muted)] transition hover:border-[var(--ks-orange)]/40 hover:text-[var(--ks-text)] focus-visible:outline-none"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--ks-orange)] ring-2 ring-[var(--ks-surface)]" />
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-4 shadow-xl z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--ks-border)]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ks-text)]">
                        Notifications
                      </h3>
                      <span className="text-[10px] text-[var(--ks-text-muted)]">Real-time</span>
                    </div>
                    <div className="py-6 text-center">
                      <Bell className="h-8 w-8 mx-auto text-[var(--ks-text-muted)]/40 mb-2" />
                      <p className="text-xs font-semibold text-[var(--ks-text)]">No new notifications</p>
                      <p className="text-[11px] text-[var(--ks-text-muted)] mt-1">
                        Course updates and quiz results will appear here.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Pill (Links to real /profile) */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 rounded-full border border-[var(--ks-border)] bg-[var(--ks-surface)] py-1 pl-2 pr-3 shadow-xs transition hover:border-[var(--ks-orange)]/40 hover:bg-[rgba(241,101,36,0.04)]"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ks-orange)] text-[11px] font-bold text-white">
                {userInitial}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-[var(--ks-text)]">
                {user?.name || 'Learner'}
              </span>
              <span className="rounded-full bg-[rgba(241,101,36,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ks-orange)]">
                {role}
              </span>
            </Link>
          </div>
        </header>

        {/* Main Body Viewport */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Help & FAQ Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#241A16]/50 backdrop-blur-xs transition-opacity"
            onClick={() => setHelpOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-[var(--ks-border)] bg-[var(--ks-surface)] p-6 sm:p-7 shadow-2xl z-50">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--ks-border)]">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="h-5 w-5 text-[var(--ks-orange)]" />
                <h3 className="font-display text-xl font-normal text-[var(--ks-text)]">Help & FAQ</h3>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded-lg p-1 text-[var(--ks-text-muted)] hover:bg-[var(--ks-bg-soft)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-[var(--ks-text)]">
              <div>
                <h4 className="font-bold text-sm text-[var(--ks-text)]">How are course quizzes generated?</h4>
                <p className="mt-1 text-[var(--ks-text-muted)] leading-relaxed">
                  Instructors can synthesize quizzes using our AI Question Generator from lesson notes or syllabi, producing calibrated questions with explanations.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[var(--ks-text)]">How is my course progress computed?</h4>
                <p className="mt-1 text-[var(--ks-text-muted)] leading-relaxed">
                  Progress is directly calculated from the number of completed lessons divided by the total lessons published in that course.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[var(--ks-text)]">Need additional support?</h4>
                <p className="mt-1 text-[var(--ks-text-muted)] leading-relaxed">
                  Reach out to the Kitsuno learning platform team at{' '}
                  <a href="mailto:contact@kitsuno.ai" className="font-semibold text-[var(--ks-orange)] hover:underline">
                    contact@kitsuno.ai
                  </a>
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--ks-border)] text-right">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded-xl bg-[var(--ks-orange)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--ks-orange-light)]"
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