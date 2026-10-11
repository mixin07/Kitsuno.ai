import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  X,
  BookOpen,
  ClipboardCheck,
  Trophy,
  Calendar,
  Zap,
  Info,
} from 'lucide-react'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/headerStatsService.js'

function formatTimeAgo(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 172800) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CATEGORY_ICONS = {
  LESSON: BookOpen,
  QUIZ: ClipboardCheck,
  ACHIEVEMENT: Trophy,
  STUDY_PLAN: Calendar,
  XP: Zap,
}

export default function NotificationsPanel({ isOpen, onClose, onUnreadCountChange }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const panelRef = useRef(null)

  // Fetch notifications whenever opened
  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const data = await getNotifications()
        if (active) {
          setNotifications(data?.items || [])
          setUnreadCount(data?.unread_count || 0)
          if (onUnreadCountChange) onUnreadCountChange(data?.unread_count || 0)
        }
      } catch (err) {
        console.error('Failed to load notifications:', err)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    if (isOpen) {
      load()
    } else {
      // Periodic soft poll for unread count
      getNotifications()
        .then((data) => {
          if (active && onUnreadCountChange) {
            onUnreadCountChange(data?.unread_count || 0)
          }
        })
        .catch(() => {})
    }

    return () => {
      active = false
    }
  }, [isOpen, onUnreadCountChange])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      if (onUnreadCountChange) onUnreadCountChange(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    } finally {
      setIsMarkingAll(false)
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markNotificationRead(notif.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
        if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1))
      } catch (err) {
        console.error('Failed to mark as read:', err)
      }
    }

    onClose()
    if (notif.link_url) {
      navigate(notif.link_url)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-2xs sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popover Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notification center"
        className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-1.5 w-[calc(100vw-24px)] sm:w-96 rounded-lg border-[1.5px] border-[#241A16] bg-white shadow-[3px_4px_0_#241A16] z-50 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[500px] text-[#241A16]"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-[1.5px] border-[#241A16]/15 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#241A16]">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-[4px] bg-[#F16524] text-white text-[10px] font-mono font-bold border border-[#241A16]">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-[11px] font-mono font-bold text-[#F16524] hover:text-[#d95318] px-2 py-1 rounded hover:bg-[#FFF2E6] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-neutral-600 hover:text-[#241A16] hover:bg-[#FAF8F5] rounded-md transition-colors cursor-pointer"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[rgba(36,26,22,0.1)] scrollbar-thin">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#8F8177]">
              <div className="h-5 w-5 border-2 border-[#F06424] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-[#F8F5EE] border border-[#EAD8C7] flex items-center justify-center mx-auto text-[#A2958D]">
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-[#24150F]">No new notifications</p>
              <p className="text-[11px] text-[#8F8177] max-w-xs mx-auto">
                You&apos;re completely up to date with your lessons, quizzes, and learning goals.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const IconComponent = CATEGORY_ICONS[notif.category] || Info

              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left hover:bg-black/[0.02] ${
                    !notif.is_read ? 'bg-[#FDF1E6]/40 font-medium' : 'bg-transparent'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      !notif.is_read
                        ? 'bg-[#F06424]/12 text-[#F06424]'
                        : 'bg-[#F8F5EE] text-[#8F8177]'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#24150F] truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-[#8F8177] shrink-0">
                        {formatTimeAgo(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6F625B] mt-0.5 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.is_read && (
                    <span className="h-2 w-2 rounded-full bg-[#F06424] shrink-0 mt-1.5" />
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Panel Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-[#EAD8C7] bg-[#FAF8F5] text-center">
            <span className="text-[10px] text-[#8F8177]">
              Showing real activity notifications
            </span>
          </div>
        )}
      </div>
    </>
  )
}
