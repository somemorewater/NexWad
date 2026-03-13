import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { adminAPI } from '../api/endpoints'
import toast from 'react-hot-toast'
import { formatDistanceToNow, format } from 'date-fns'

const FALLBACK_REPORTS = [
  {
    _id: 'rep-1',
    targetType: 'post',
    targetName: 'Post by @charles',
    targetId: 'post-122',
    reporter: { name: 'Amina Yusuf' },
    reason: 'Suspicious listing links',
    status: 'open',
    createdAt: '2026-03-12T08:10:00Z',
  },
  {
    _id: 'rep-2',
    targetType: 'user',
    targetName: 'User @kelvin',
    targetId: 'user-51',
    reporter: { name: 'David Ojo' },
    reason: 'Harassment in chat',
    status: 'open',
    createdAt: '2026-03-11T18:32:00Z',
  },
  {
    _id: 'rep-3',
    targetType: 'listing',
    targetName: 'Listing: HP Spectre',
    targetId: 'listing-63',
    reporter: { name: 'Morenike Ajayi' },
    reason: 'Counterfeit electronics',
    status: 'open',
    createdAt: '2026-03-10T11:22:00Z',
  },
]

const ACTION_LOG = [
  { id: 'act-1', action: 'Muted user @kelvin for 24 hours', time: '2026-03-12T09:44:00Z' },
  { id: 'act-2', action: 'Removed post #122 for suspicious links', time: '2026-03-11T21:10:00Z' },
  { id: 'act-3', action: 'Escalated listing #63 to admin', time: '2026-03-10T12:40:00Z' },
]

export default function ModeratorDashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')

  useEffect(() => {
    let alive = true
    const loadReports = async () => {
      try {
        setLoading(true)
        if (filter === 'all') {
          const [openRes, resolvedRes] = await Promise.all([
            adminAPI.getReports({ status: 'open' }),
            adminAPI.getReports({ status: 'resolved' }),
          ])
          if (!alive) return
          const merged = [...(openRes.data.reports || []), ...(resolvedRes.data.reports || [])]
          const byId = new Map()
          merged.forEach(report => byId.set(report._id, report))
          setReports(Array.from(byId.values()))
        } else {
          const { data } = await adminAPI.getReports({ status: filter })
          if (!alive) return
          setReports(data.reports || [])
        }
      } catch {
        if (!alive) return
        setReports(FALLBACK_REPORTS)
      } finally {
        if (alive) setLoading(false)
      }
    }
    loadReports()
    return () => { alive = false }
  }, [filter])

  const metrics = useMemo(() => {
    const open = reports.filter(r => r.status === 'open').length
    const resolved = reports.filter(r => r.status === 'resolved').length
    return { open, resolved, total: reports.length }
  }, [reports])

  const handleAction = async (report, action) => {
    const previous = reports
    const optimistic = reports.map(r => r._id === report._id ? { ...r, status: 'resolved', actionTaken: action } : r)
    setReports(optimistic)
    try {
      await adminAPI.resolveReport(report._id, {
        action,
        targetType: report.targetType,
        targetId: report.targetId,
      })
      toast.success('Report updated')
    } catch {
      setReports(previous)
      toast.error('Failed to update')
    }
  }

  const statusBadge = (status) => {
    if (status === 'resolved') return 'badge-green'
    if (status === 'open') return 'badge-gold'
    return 'badge-gray'
  }

  return (
    <div>
      <Navbar />
      <div className="moderator-layout">
        <aside className="moderator-sidebar">
          <div className="moderator-sidebar__title">Moderator Desk</div>
          <div className="moderator-sidebar__section">
            <button className={`moderator-filter ${filter === 'open' ? 'active' : ''}`} onClick={() => setFilter('open')}>Open Reports</button>
            <button className={`moderator-filter ${filter === 'resolved' ? 'active' : ''}`} onClick={() => setFilter('resolved')}>Resolved</button>
            <button className={`moderator-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Reports</button>
          </div>
          <div className="moderator-sidebar__divider" />
          <div className="moderator-sidebar__note">
            Use this desk to resolve reports, monitor user behavior, and escalate critical risks to admins.
          </div>
        </aside>

        <main className="moderator-main">
          <div className="moderator-hero">
            <div>
              <div className="moderator-hero__title">Moderation Overview</div>
              <div className="cs-subtitle">Keep the marketplace safe and fair.</div>
            </div>
            <div className="moderator-metrics">
              <div className="moderator-metric">
                <div className="moderator-metric__value">{metrics.open}</div>
                <div className="moderator-metric__label">Open</div>
              </div>
              <div className="moderator-metric">
                <div className="moderator-metric__value">{metrics.resolved}</div>
                <div className="moderator-metric__label">Resolved</div>
              </div>
              <div className="moderator-metric">
                <div className="moderator-metric__value">{metrics.total}</div>
                <div className="moderator-metric__label">Total</div>
              </div>
            </div>
          </div>

          <div className="moderator-grid">
            <section className="card moderator-card">
              <div className="moderator-card__header">
                <div>
                  <div className="moderator-card__title">Report Queue</div>
                  <div className="cs-subtitle">Prioritize urgent cases and take action quickly.</div>
                </div>
              </div>
              <div className="moderator-card__body">
                {loading ? (
                  <div style={{ padding: 16 }}>
                    {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12, marginBottom: 10 }} />)}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state__icon"><i className="fa-solid fa-shield" aria-hidden="true" /></div>
                    <div style={{ fontWeight: 600 }}>No reports in this queue</div>
                    <div className="caption">Everything looks calm. Check back later.</div>
                  </div>
                ) : (
                  <div className="moderator-report-list">
                    {reports.map(report => (
                      <div key={report._id} className="moderator-report">
                        <div>
                          <div className="moderator-report__title">{report.reason || 'Reported content'}</div>
                          <div className="moderator-report__meta">
                            {(report.targetName || report.targetTitle || 'Content')} · {String(report.targetType || 'content').toUpperCase()} · Reported by {report.reporter?.name || 'User'}
                          </div>
                          <div className="moderator-report__time">
                            {report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }) : 'Recently'}
                          </div>
                        </div>
                        <div className="moderator-report__actions">
                          <span className={`badge ${statusBadge(report.status)}`}>{report.status || 'open'}</span>
                          {report.status === 'resolved' ? (
                            <div className="caption">Resolved</div>
                          ) : (
                            <div className="moderator-action-buttons">
                              <button className="btn btn-ghost btn-sm" type="button" onClick={() => handleAction(report, 'dismiss')}>Dismiss</button>
                              <button className="btn btn-secondary btn-sm" type="button" onClick={() => handleAction(report, 'warn')}>Warn</button>
                              <button className="btn btn-danger btn-sm" type="button" onClick={() => handleAction(report, 'remove')}>Remove</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="card moderator-card">
              <div className="moderator-card__header">
                <div>
                  <div className="moderator-card__title">Recent Actions</div>
                  <div className="cs-subtitle">A quick log of actions taken today.</div>
                </div>
              </div>
              <div className="moderator-card__body">
                <div className="moderator-action-list">
                  {ACTION_LOG.map(entry => (
                    <div key={entry.id} className="moderator-action">
                      <div className="moderator-action__dot" />
                      <div>
                        <div className="moderator-action__text">{entry.action}</div>
                        <div className="moderator-action__time">{format(new Date(entry.time), 'MMM d, yyyy • HH:mm')}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-ghost btn-sm" type="button">View full audit log</button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
