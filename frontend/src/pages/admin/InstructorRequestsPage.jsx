import { useEffect, useState, useCallback } from 'react'
import {
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Users,
  GraduationCap,
} from 'lucide-react'
import {
  getInstructorRequests,
  approveInstructorRequest,
  rejectInstructorRequest,
} from '../../services/adminService.js'
import StateMessage from '../../components/StateMessage.jsx'
import NeoMetricCard from '../../components/NeoMetricCard.jsx'

export default function InstructorRequestsPage() {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [filter, setFilter] = useState('ALL') // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('')
  const [feedback, setFeedback] = useState(null)

  const loadRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getInstructorRequests()
      setRequests(data)
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.detail || 'Failed to load instructor requests',
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  async function handleApprove(userId, userName) {
    setActionLoadingId(userId)
    setFeedback(null)
    try {
      const updated = await approveInstructorRequest(userId)
      setRequests((prev) =>
        prev.map((r) => (r.id === userId ? { ...r, ...updated } : r)),
      )
      setFeedback({
        type: 'success',
        message: `Instructor account for "${userName}" has been approved. They can now access Instructor Studio.`,
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.detail || 'Failed to approve instructor request.',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleReject(userId, userName) {
    setActionLoadingId(userId)
    setFeedback(null)
    try {
      const updated = await rejectInstructorRequest(userId)
      setRequests((prev) =>
        prev.map((r) => (r.id === userId ? { ...r, ...updated } : r)),
      )
      setFeedback({
        type: 'info',
        message: `Instructor request for "${userName}" was rejected.`,
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.detail || 'Failed to reject instructor request.',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const pendingCount = requests.filter((r) => r.approval_status === 'PENDING').length
  const approvedCount = requests.filter((r) => r.approval_status === 'APPROVED' && r.role === 'INSTRUCTOR').length
  const rejectedCount = requests.filter((r) => r.approval_status === 'REJECTED').length

  const filteredRequests = requests.filter((r) => {
    if (filter === 'PENDING' && r.approval_status !== 'PENDING') return false
    if (filter === 'APPROVED' && (r.approval_status !== 'APPROVED' || r.role !== 'INSTRUCTOR')) return false
    if (filter === 'REJECTED' && r.approval_status !== 'REJECTED') return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = (r.name || '').toLowerCase().includes(q)
      const matchEmail = (r.email || '').toLowerCase().includes(q)
      return matchName || matchEmail
    }
    return true
  })

  if (isLoading) {
    return <StateMessage variant="loading" title="Loading instructor requests..." />
  }

  return (
    <div className="space-y-6 md:space-y-8 w-full pb-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#241A16]">
        <div>
          <span className="ks-eyebrow block">ADMINISTRATION CONTROL</span>
          <h1 className="ks-page-title mt-0.5">Instructor Requests &amp; Approvals</h1>
          <p className="ks-muted mt-1">
            Review educator registration requests, grant Instructor Studio privileges, or reject unauthorized submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#241A16] bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 shadow-[1.5px_1.5px_0_#241A16]">
              <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
              {pendingCount} Pending Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#241A16] bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 shadow-[1.5px_1.5px_0_#241A16]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Queue Clean · No Pending Requests
            </span>
          )}
        </div>
      </div>

      {/* 2. Metrics Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NeoMetricCard
          label="Pending Review"
          value={pendingCount}
          icon={Clock}
          iconColor="text-amber-700"
          valueColor={pendingCount > 0 ? 'text-amber-700' : 'text-[#241A16]'}
          badge={pendingCount > 0 ? 'Action Required' : null}
          badgeVariant="warning"
          hint="Educators awaiting studio authorization"
        />
        <NeoMetricCard
          label="Approved Instructors"
          value={approvedCount}
          icon={GraduationCap}
          iconColor="text-emerald-700"
          valueColor="text-emerald-700"
          badge={approvedCount > 0 ? 'Active Faculty' : null}
          badgeVariant="success"
          hint="Granted full course publishing access"
        />
        <NeoMetricCard
          label="Rejected Requests"
          value={rejectedCount}
          icon={UserX}
          iconColor="text-rose-700"
          valueColor={rejectedCount > 0 ? 'text-rose-700' : 'text-[#241A16]'}
          hint="Submissions declined by administrators"
        />
        <NeoMetricCard
          label="Total Submissions"
          value={requests.length}
          icon={Users}
          hint="All educator onboarding requests recorded"
        />
      </div>

      {/* 3. Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-[6px] border-[1.5px] border-[#241A16] p-4 shadow-[2px_2px_0_#241A16] ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-900'
              : 'bg-amber-50 text-amber-900'
          }`}
        >
          {feedback.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />}
          {feedback.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />}
          {feedback.type === 'info' && <Clock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />}
          <div className="flex-1 text-xs font-semibold">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[10px] font-bold uppercase tracking-wider text-[#241A16] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4. Controls & Table */}
      <div className="ks-neo-card bg-white p-5 sm:p-6 rounded-[8px] border-2 border-[#241A16] shadow-[3px_3px_0_#241A16] md:shadow-[4px_4px_0_#241A16] space-y-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="inline-flex rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] p-1 shadow-[1.5px_1.5px_0_#241A16]">
            {[
              { id: 'ALL', label: `All (${requests.length})` },
              { id: 'PENDING', label: `Pending (${pendingCount})` },
              { id: 'APPROVED', label: `Approved (${approvedCount})` },
              { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  filter === t.id
                    ? 'bg-white text-[#241A16] shadow-[1px_1px_0_#241A16] border border-[#241A16]'
                    : 'text-[#6F625B] hover:text-[#241A16] border border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8F8177] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name or email..."
              className="w-full rounded-[6px] border-[1.5px] border-[#241A16] bg-[#FAF8F5] pl-9 pr-3 py-1.5 text-xs text-[#241A16] placeholder:text-[#8F8177] shadow-[1.5px_1.5px_0_#241A16] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Requests Table */}
        {filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#241A16] bg-[#FAF8F5]">
                  <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[#6F625B]">
                    Applicant
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[#6F625B]">
                    Email Address
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[#6F625B]">
                    Requested Role
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[#6F625B]">
                    Submission Date
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[#6F625B]">
                    Approval Status
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[#6F625B] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAD8C7]">
                {filteredRequests.map((req) => {
                  const isPending = req.approval_status === 'PENDING'
                  const isAppr = req.approval_status === 'APPROVED' && req.role === 'INSTRUCTOR'
                  const isRej = req.approval_status === 'REJECTED'
                  const isActionLoading = actionLoadingId === req.id

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-[#FFFDF9] transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full border border-[#241A16] bg-[#FAF8F5] flex items-center justify-center font-bold text-xs text-[#241A16] shrink-0">
                            {req.name ? req.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-[#241A16] leading-tight">
                              {req.name}
                            </p>
                            <p className="text-[10px] font-mono text-[#8F8177]">
                              ID: #{req.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-xs text-[#241A16]">
                        {req.email}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#241A16] bg-[#FFF4E6] px-2 py-0.5 text-[10px] font-bold text-[#E8590C]">
                          <GraduationCap className="h-3 w-3" />
                          {req.requested_role || req.role}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-[#6F625B]">
                        {req.created_at
                          ? new Date(req.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>

                      <td className="py-3 px-3">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#241A16] bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 shadow-[1px_1px_0_#241A16]">
                            <Clock className="h-3 w-3 text-amber-700 animate-pulse" />
                            Pending Review
                          </span>
                        )}
                        {isAppr && (
                          <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#241A16] bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900 shadow-[1px_1px_0_#241A16]">
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                            Approved
                          </span>
                        )}
                        {isRej && (
                          <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#241A16] bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-900 shadow-[1px_1px_0_#241A16]">
                            <XCircle className="h-3 w-3 text-rose-700" />
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {!isAppr && (
                            <button
                              type="button"
                              onClick={() => handleApprove(req.id, req.name)}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-1 rounded-[5px] border-[1.5px] border-[#241A16] bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-[1.5px_1.5px_0_#241A16] hover:bg-emerald-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                              title="Approve educator account"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{isActionLoading ? '...' : 'Approve'}</span>
                            </button>
                          )}

                          {!isRej && (
                            <button
                              type="button"
                              onClick={() => handleReject(req.id, req.name)}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-1 rounded-[5px] border-[1.5px] border-[#241A16] bg-white px-2.5 py-1 text-[11px] font-bold text-rose-700 shadow-[1.5px_1.5px_0_#241A16] hover:bg-rose-50 hover:border-rose-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                              title="Reject educator request"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>{isActionLoading ? '...' : 'Reject'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[6px] border-[1.5px] border-dashed border-[#241A16] bg-[#FAF8F5] p-8 text-center space-y-2">
            <Users className="mx-auto h-8 w-8 text-[#8F8177]" />
            <p className="text-xs font-bold text-[#241A16]">
              No requests found matching your filter
            </p>
            <p className="text-[11px] text-[#6F625B]">
              {searchQuery
                ? `No submissions matched "${searchQuery}".`
                : filter === 'PENDING'
                ? 'All instructor requests have been reviewed and processed!'
                : 'No instructor requests recorded in this category.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
