import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import { adminAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { useModal } from '../context/ModalContext'

export default function AdminDashboard() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'super_admin'
  const isDeveloper = user?.role === 'developer'
  const basePath = isDeveloper ? '/developer' : (isSuperAdmin ? '/super-admin' : '/admin')
  const adminNavItems = isDeveloper
    ? [{ to: `${basePath}/performance`, label: 'Performance' }]
    : [
      { to: basePath, label: 'Overview', end: true },
      { to: `${basePath}/performance`, label: 'Performance' },
      { to: `${basePath}/users`, label: 'Users' },
      { to: `${basePath}/applications`, label: 'Seller Applications' },
      { to: `${basePath}/listings`, label: 'Listings' },
      { to: `${basePath}/reports`, label: 'Reports' },
      { to: `${basePath}/logs`, label: 'Audit Logs' },
    ]

  return (
    <div>
      <Navbar />
      <div className="admin-layout admin-dashboard-layout">
        <aside className="admin-layout__sidebar admin-dashboard-sidebar">
          <div className="admin-sidebar-heading">
            {isDeveloper ? 'Developer Panel' : (isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel')}
          </div>
          <div className="admin-sidebar-nav">
            {adminNavItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="admin-sidebar-divider">
            <NavLink
              to="/home"
              className={({ isActive }) => `admin-sidebar-link admin-sidebar-link--back${isActive ? ' active' : ''}`}
            >
              <i className="fa-solid fa-arrow-left admin-sidebar-link__icon" aria-hidden="true" />
              Buyer Hub
            </NavLink>
          </div>
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-user__label">Signed in as</div>
            <div className="admin-sidebar-user__name">{user?.name}</div>
            <div className="admin-sidebar-user__role">{user?.role?.replace('_', ' ')}</div>
          </div>
        </aside>
        <main className="admin-layout__main admin-dashboard-main">
          <Routes>
            <Route path="/" element={isDeveloper ? <Navigate to="performance" replace /> : <AdminOverview />} />
            <Route path="/performance" element={<AdminPerformance />} />
            {!isDeveloper && (
              <>
                <Route path="/users" element={<AdminUsers isSuperAdmin={isSuperAdmin} />} />
                <Route path="/applications" element={<AdminSellerApplications />} />
                <Route path="/listings" element={<AdminListings />} />
                <Route path="/reports" element={<AdminReports />} />
                <Route path="/logs" element={<AdminLogs />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  )
}

function StatCard({ iconClass, label, value, color, textColor }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="stat-card__icon" style={{ background: color, color: textColor, fontSize: '1.2rem' }}>
        <i className={iconClass} aria-hidden="true" />
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  )
}

function buildLinePath(points = []) {
  if (!points.length) return ''
  const [first, ...rest] = points
  return `M ${first.x} ${first.y} ${rest.map(p => `L ${p.x} ${p.y}`).join(' ')}`
}

function LineChart({ series = [], height = 160, yMaxOverride }) {
  const width = 600
  const padding = { top: 12, right: 16, bottom: 24, left: 36 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const allValues = series.flatMap(s => s.data.map(d => d.value || 0))
  const maxValue = yMaxOverride || Math.max(1, ...allValues)
  const gridLines = 4

  const toPoint = (value, index, total) => {
    const x = padding.left + (total <= 1 ? 0 : (index / (total - 1)) * plotWidth)
    const y = padding.top + (plotHeight - (value / maxValue) * plotHeight)
    return { x, y }
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Line chart">
      <rect x="0" y="0" width={width} height={height} fill="transparent" />
      {[...Array(gridLines + 1)].map((_, i) => {
        const y = padding.top + (plotHeight / gridLines) * i
        return <line key={i} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="var(--nw-gray-100)" strokeWidth="1" />
      })}
      {series.map((s, idx) => {
        const points = s.data.map((d, i) => toPoint(d.value || 0, i, s.data.length))
        return (
          <g key={s.label || idx}>
            <path d={buildLinePath(points)} fill="none" stroke={s.color} strokeWidth="2.5" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={s.color} />
            ))}
          </g>
        )
      })}
      {series[0]?.data?.map((d, i) => {
        const x = padding.left + (series[0].data.length <= 1 ? 0 : (i / (series[0].data.length - 1)) * plotWidth)
        return (
          <text key={i} x={x} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--nw-gray-500)">
            {d.label}
          </text>
        )
      })}
      <text x={padding.left} y={padding.top - 2} fontSize="10" fill="var(--nw-gray-500)">
        {Math.round(maxValue)}
      </text>
      <text x={padding.left} y={height - padding.bottom + 2} fontSize="10" fill="var(--nw-gray-500)">
        0
      </text>
    </svg>
  )
}

function AdminOverview() {
  const [stats, setStats] = useState(null)
  useEffect(() => { adminAPI.getStats().then(({ data }) => setStats(data)).catch(() => {}) }, [])
  const planEntries = Object.entries(stats?.planBreakdown || {}).sort((a, b) => b[1] - a[1])
  const postsSeries = stats?.postsDailySeries || []
  const listingsSeries = stats?.listingsDailySeries || []
  const maxSeriesValue = Math.max(
    1,
    ...postsSeries.map(p => p.count || 0),
    ...listingsSeries.map(l => l.count || 0)
  )

  return (
    <div>
      <h1 className="admin-page-title">Platform Overview</h1>
      {!stats ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: 'var(--space-8)' }}>
            <StatCard iconClass="fa-solid fa-users" label="Total Users" value={stats.totalUsers?.toLocaleString()} color="var(--nw-primary-light)" textColor="var(--nw-primary)" />
            <StatCard iconClass="fa-solid fa-cart-shopping" label="Active Listings" value={stats.activeListings?.toLocaleString()} color="var(--nw-accent-light)" textColor="var(--nw-accent)" />
            <StatCard iconClass="fa-solid fa-naira-sign" label="Total Revenue" value={`₦${(stats.totalRevenue||0).toLocaleString()}`} color="var(--nw-green-light)" textColor="var(--nw-green)" />
            <StatCard iconClass="fa-solid fa-flag" label="Open Reports" value={stats.openReports} color="var(--nw-red-light)" textColor="var(--nw-red)" />
            <StatCard iconClass="fa-solid fa-star" label="Premium Users" value={stats.premiumUsers} color="var(--nw-gold-light)" textColor="#92400e" />
            <StatCard iconClass="fa-solid fa-magnifying-glass" label="Active Lost Items" value={stats.activeLostFound} color="var(--nw-gray-100)" textColor="var(--nw-gray-600)" />
          </div>
          <div className="grid-3" style={{ marginBottom: 'var(--space-8)' }}>
            <StatCard iconClass="fa-solid fa-signal" label="Current Active Users" value={stats.currentActiveUsers?.toLocaleString()} color="var(--nw-primary-light)" textColor="var(--nw-primary)" />
            <StatCard iconClass="fa-solid fa-user-check" label="Daily Active Users" value={stats.dailyActiveUsers?.toLocaleString()} color="var(--nw-green-light)" textColor="var(--nw-green)" />
            <StatCard iconClass="fa-solid fa-message" label="Total Posts" value={stats.totalPosts?.toLocaleString()} color="var(--nw-accent-light)" textColor="var(--nw-accent)" />
            <StatCard iconClass="fa-solid fa-calendar-day" label="Posts Today" value={stats.postsToday?.toLocaleString()} color="var(--nw-gold-light)" textColor="#92400e" />
            <StatCard iconClass="fa-solid fa-chart-line" label="Avg Listings / Day (7d)" value={(stats.avgListingsPerDay || 0).toFixed(1)} color="var(--nw-gray-100)" textColor="var(--nw-gray-600)" />
            <StatCard iconClass="fa-solid fa-layer-group" label="Plans Tracked" value={planEntries.length} color="var(--nw-red-light)" textColor="var(--nw-red)" />
          </div>
          <div className="grid-2" style={{ marginBottom: 'var(--space-8)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
            <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Plan Breakdown</div>
                <div className="caption">Verified users by subscription plan.</div>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {planEntries.length === 0 ? (
                  <div className="caption">No plan data yet.</div>
                ) : planEntries.map(([plan, count]) => (
                  <div key={plan} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'var(--nw-gray-50)' }}>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{String(plan).replace('_', ' ')}</span>
                    <span className="badge badge-primary">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Performance Trends</div>
                <div className="caption">Posts vs listings for the last 7 days.</div>
              </div>
              <LineChart
                series={[
                  {
                    label: 'Posts',
                    color: 'var(--nw-accent)',
                    data: postsSeries.map(p => ({ label: p.date.slice(5), value: p.count })),
                  },
                  {
                    label: 'Listings',
                    color: 'var(--nw-primary)',
                    data: listingsSeries.map(p => ({ label: p.date.slice(5), value: p.count })),
                  },
                ]}
                yMaxOverride={maxSeriesValue}
              />
              <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--nw-gray-600)', marginTop: 8 }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--nw-accent)', marginRight: 6 }} />Posts</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--nw-primary)', marginRight: 6 }} />Listings</span>
              </div>
            </div>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--nw-gray-100)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Recent Registrations</h3>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Joined</th><th>Plan</th></tr></thead>
                <tbody>
                  {(stats.recentUsers || []).map(u => (
                    <tr key={u._id}>
                      <td data-label="Name" style={{ fontWeight: 500 }}>{u.name}</td>
                      <td data-label="Email" style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{u.email}</td>
                      <td data-label="Department" style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{u.department}</td>
                      <td data-label="Joined" style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</td>
                      <td data-label="Plan"><span className="badge badge-primary">{u.subscription?.plan || 'basic'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function AdminPerformance() {
  const [stats, setStats] = useState(null)
  useEffect(() => { adminAPI.getStats().then(({ data }) => setStats(data)).catch(() => {}) }, [])
  const perfSeries = stats?.performanceDailySeries || []
  const perfSummary = stats?.performanceSummary || {}
  const maxPerfValue = Math.max(1, ...perfSeries.map(p => p.avgDurationMs || 0))

  return (
    <div>
      <h1 className="admin-page-title">Performance Analytics</h1>
      {!stats ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>API Performance</div>
              <div className="caption">Response time and errors in the last {perfSummary.windowHours || 24} hours.</div>
            </div>
            <div className="grid-3" style={{ gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{Math.round(perfSummary.avgDurationMs || 0)} ms</div>
                <div className="caption">Avg response</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{Math.round(perfSummary.p95DurationMs || 0)} ms</div>
                <div className="caption">P95 latency</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{Math.round(perfSummary.p99DurationMs || 0)} ms</div>
                <div className="caption">P99 latency</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{perfSummary.totalRequests?.toLocaleString?.() || 0}</div>
                <div className="caption">Requests</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{((perfSummary.errorRate || 0) * 100).toFixed(1)}%</div>
                <div className="caption">Error rate</div>
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <div className="caption" style={{ marginBottom: 8 }}>Slowest routes</div>
              {perfSummary.slowestRoutes?.length ? (
                <div style={{ display: 'grid', gap: 6 }}>
                  {perfSummary.slowestRoutes.map((route) => (
                    <div key={`${route.method}-${route.route}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--nw-gray-50)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--nw-gray-600)' }}>{route.method} {route.route}</div>
                      <div style={{ fontWeight: 600 }}>{Math.round(route.avgDurationMs || 0)} ms</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="caption">No performance data yet.</div>
              )}
            </div>
          </div>
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Avg Response Time (7d)</div>
              <div className="caption">Average API duration per day.</div>
            </div>
            <LineChart
              series={[
                {
                  label: 'Avg Response (ms)',
                  color: 'var(--nw-primary)',
                  data: perfSeries.map(p => ({ label: p.date.slice(5), value: p.avgDurationMs })),
                },
              ]}
              yMaxOverride={maxPerfValue}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function AdminUsers({ isSuperAdmin }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const { confirm, prompt } = useModal()

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      adminAPI.getUsers({ q }).then(({ data }) => setUsers(data.users || [])).catch(() => {}).finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const ban = async (userId, name) => {
    const confirmed = await confirm({
      title: 'Ban User',
      message: `Ban ${name}?`,
      confirmLabel: 'Ban',
      cancelLabel: 'Cancel',
    })
    if (!confirmed) return
    try { await adminAPI.banUser(userId, 'Admin action'); setUsers(p => p.map(u => u._id === userId ? { ...u, banned: true } : u)); toast.success('User banned') }
    catch { toast.error('Failed') }
  }

  const unban = async (userId) => {
    try { await adminAPI.unbanUser(userId); setUsers(p => p.map(u => u._id === userId ? { ...u, banned: false } : u)); toast.success('Unbanned') }
    catch { toast.error('Failed') }
  }

  const warn = async (userId, name) => {
    const reason = await prompt({
      title: 'Warn User',
      message: `Warning reason for ${name}:`,
      defaultValue: 'Please follow community guidelines.',
      confirmLabel: 'Send Warning',
      cancelLabel: 'Cancel',
      required: true,
    })
    if (!reason) return
    try {
      const { data } = await adminAPI.warnUser(userId, reason)
      setUsers((prev) => prev.map((u) => (
        u._id === userId
          ? { ...u, warningsCount: data?.warningCount ?? ((u.warningsCount || 0) + 1) }
          : u
      )))
      toast.success('Warning sent')
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to warn user')
    }
  }

  const changeRole = async (userId, role) => {
    if (!isSuperAdmin) {
      toast.error('Only super admin can change roles')
      return
    }
    try { await adminAPI.updateUserRole(userId, role); setUsers(p => p.map(u => u._id === userId ? { ...u, role } : u)); toast.success('Role updated') }
    catch (err) { toast.error(err?.error || err?.message || 'Failed') }
  }

  return (
    <div>
      <h1 className="admin-page-title">User Management</h1>
      {!isSuperAdmin && (
        <div className="card card-body" style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ fontWeight: 700 }}>Role changes restricted</div>
          <div className="caption">Only super admin can change user roles.</div>
        </div>
      )}
      <input type="text" className="form-input admin-search-input" placeholder="Search by name, email, or matric…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>User</th><th>Matric</th><th>Role</th><th>Plan</th><th>Warnings</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td data-label="User">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', borderRadius: '50%' }} /> : u.name?.[0]}</div>
                        <div><div style={{ fontWeight: 500 }}>{u.name}</div><div style={{ fontSize: '0.8125rem', color: 'var(--nw-gray-500)' }}>{u.email}</div></div>
                      </div>
                    </td>
                    <td data-label="Matric" style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{u.matricNumber}</td>
                    <td data-label="Role">
                      <select
                        value={u.role || 'user'}
                        onChange={e => changeRole(u._id, e.target.value)}
                        disabled={!isSuperAdmin}
                        style={{ border: '1px solid var(--nw-gray-200)', borderRadius: 6, padding: '4px 8px', fontSize: '0.8125rem', fontFamily: 'var(--font-body)', cursor: isSuperAdmin ? 'pointer' : 'not-allowed', outline: 'none', opacity: isSuperAdmin ? 1 : 0.7 }}
                      >
                        {['user', 'cs', 'moderator', 'admin', 'developer', 'super_admin'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td data-label="Plan"><span className="badge badge-primary">{u.subscription?.plan || 'basic'}</span></td>
                    <td data-label="Warnings"><span className="badge badge-accent">{u.warningsCount || 0}</span></td>
                    <td data-label="Status"><span className={`badge ${u.banned ? 'badge-red' : 'badge-green'}`}>{u.banned ? 'Banned' : 'Active'}</span></td>
                    <td data-label="Actions">
                      <div className="admin-row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => warn(u._id, u.name)}>Warn</button>
                        {u.banned
                          ? <button className="btn btn-ghost btn-sm" onClick={() => unban(u._id)}>Unban</button>
                          : <button className="btn btn-danger btn-sm" onClick={() => ban(u._id, u.name)}>Ban</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminSellerApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [actingId, setActingId] = useState(null)
  const [selectedApp, setSelectedApp] = useState(null)
  const { prompt } = useModal()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await adminAPI.getSellerApplications({ status })
      setApplications(data.applications || [])
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to load seller applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status])

  const approve = async (id) => {
    setActingId(id)
    try {
      await adminAPI.approveSellerApplication(id)
      toast.success('Seller application approved')
      setApplications(prev => prev.map(app => app._id === id ? { ...app, status: 'approved', approvedAt: new Date().toISOString() } : app))
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to approve application')
    } finally {
      setActingId(null)
    }
  }

  const reject = async (id) => {
    const reason = await prompt({
      title: 'Reject Application',
      message: 'Reason for rejection (optional):',
      defaultValue: 'Application rejected by admin',
      confirmLabel: 'Reject',
      cancelLabel: 'Cancel',
    }) || 'Application rejected by admin'
    setActingId(id)
    try {
      await adminAPI.rejectSellerApplication(id, reason)
      toast.success('Seller application rejected')
      setApplications(prev => prev.map(app => app._id === id ? { ...app, status: 'rejected', rejectionReason: reason } : app))
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to reject application')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div>
      <h1 className="admin-page-title">
        Seller Applications
      </h1>
      <div className="admin-status-filters">
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} className={`btn ${status === s ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setStatus(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Applicant</th><th>Plan</th><th>Amount</th><th>Reference</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--nw-gray-500)' }}>No applications found.</td></tr>
                ) : applications.map(app => (
                  <tr key={app._id}>
                    <td data-label="Applicant">
                      <div style={{ fontWeight: 600 }}>{app.user?.name || 'Unknown user'}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--nw-gray-500)' }}>{app.user?.email || 'No email'}</div>
                    </td>
                    <td data-label="Plan"><span className="badge badge-primary">{app.plan}</span></td>
                    <td data-label="Amount">₦{(app.amount || 0).toLocaleString()}</td>
                    <td data-label="Reference" style={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.paymentReference}</td>
                    <td data-label="Submitted" style={{ color: 'var(--nw-gray-500)', fontSize: '0.8125rem' }}>{formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}</td>
                    <td data-label="Status">
                      <span className={`badge ${app.status === 'approved' ? 'badge-green' : app.status === 'rejected' ? 'badge-red' : 'badge-accent'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td data-label="Actions">
                      {app.status === 'pending' ? (
                        <div className="admin-row-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedApp(app)}>
                            Review
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => approve(app._id)} disabled={actingId === app._id}>
                            {actingId === app._id ? '...' : 'Approve'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => reject(app._id)} disabled={actingId === app._id}>
                            {actingId === app._id ? '...' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <div className="admin-row-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedApp(app)}>
                            Review
                          </button>
                          <span className="caption">{app.rejectionReason || 'No pending action'}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title="Seller Application Review"
        size="lg"
      >
        {selectedApp && (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <div className="card card-body" style={{ padding: 'var(--space-4)' }}>
              <div className="admin-modal-grid">
                <Detail label="Applicant" value={selectedApp.user?.name || 'Unknown'} />
                <Detail label="Email" value={selectedApp.user?.email || 'No email'} />
                <Detail label="Plan" value={selectedApp.plan} />
                <Detail label="Amount" value={`₦${(selectedApp.amount || 0).toLocaleString()}`} />
                <Detail label="Payment Ref" value={selectedApp.paymentReference} />
                <Detail label="Status" value={selectedApp.status} />
              </div>
            </div>

            <div className="card card-body" style={{ padding: 'var(--space-4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-3)' }}>Application Details</h3>
              <div className="admin-modal-grid">
                <Detail label="Full Name" value={selectedApp.application?.fullName} />
                <Detail label="Store Name" value={selectedApp.application?.storeName} />
                <Detail label="Phone" value={selectedApp.application?.phone} />
                <Detail label="ID Type" value={selectedApp.application?.idType || (selectedApp.application?.nin ? 'nin' : 'unknown')} />
                <Detail label="ID Number" value={selectedApp.application?.idNumber || selectedApp.application?.nin} />
                <Detail label="Experience" value={selectedApp.application?.experience || 'N/A'} />
              </div>
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--nw-gray-600)', marginBottom: 4 }}>Product Details</div>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--nw-ink)' }}>{selectedApp.application?.productDetails || 'N/A'}</div>
              </div>
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--nw-gray-600)', marginBottom: 4 }}>Reason</div>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--nw-ink)' }}>{selectedApp.application?.reason || 'N/A'}</div>
              </div>
            </div>

            <div className="card card-body" style={{ padding: 'var(--space-4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-3)' }}>
                {selectedApp.application?.idType === 'nin' ? 'National ID Image' : 'School ID Image'}
              </h3>
              {selectedApp.application?.schoolIdImage ? (
                <>
                  <img
                    src={selectedApp.application.schoolIdImage}
                    alt="School ID"
                    style={{ width: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--nw-gray-100)' }}
                  />
                  <a
                    href={selectedApp.application.schoolIdImage}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-block', marginTop: 'var(--space-2)', color: 'var(--nw-primary)', fontWeight: 600 }}
                  >
                    Open image in new tab
                  </a>
                </>
              ) : (
                <div className="caption">No image uploaded.</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--nw-gray-600)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--nw-ink)', wordBreak: 'break-word' }}>{value || 'N/A'}</div>
    </div>
  )
}

function AdminListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminAPI.getListings().then(({ data }) => setListings(data.listings || [])).catch(() => {}).finally(() => setLoading(false)) }, [])

  const toggle = async (id, featured) => {
    try { await adminAPI.featureListing(id, !featured); setListings(p => p.map(l => l._id === id ? { ...l, isPremium: !featured } : l)); toast.success(featured ? 'Unfeatured' : 'Featured!') }
    catch { toast.error('Failed') }
  }

  return (
    <div>
      <h1 className="admin-page-title">Listings</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Title</th><th>Seller</th><th>Price</th><th>Category</th><th>Status</th><th>Featured</th></tr></thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l._id}>
                    <td data-label="Title" style={{ fontWeight: 500, maxWidth: 200 }}>{l.title}</td>
                    <td data-label="Seller" style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{l.seller?.name}</td>
                    <td data-label="Price" style={{ fontWeight: 600 }}>₦{l.price?.toLocaleString()}</td>
                    <td data-label="Category"><span className="badge badge-gray">{l.category}</span></td>
                    <td data-label="Status"><span className={`badge ${l.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{l.status}</span></td>
                    <td data-label="Featured">
                      <button className={`btn btn-sm ${l.isPremium ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => toggle(l._id, l.isPremium)}>
                        {l.isPremium ? <><i className="fa-solid fa-star" aria-hidden="true" /> Featured</> : 'Feature'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminAPI.getReports().then(({ data }) => setReports(data.reports || [])).catch(() => {}).finally(() => setLoading(false)) }, [])

  const resolve = async (id, action, targetType, targetId) => {
    try {
      await adminAPI.resolveReport(id, { action, targetType, targetId })
      setReports(p => p.map(r => r._id === id ? { ...r, status: 'resolved' } : r))
      toast.success('Report resolved')
    } catch { toast.error('Failed') }
  }

  return (
    <div>
      <h1 className="admin-page-title">Reports</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Type</th><th>Reason</th><th>Reporter</th><th>Target</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r._id}>
                    <td data-label="Type"><span className="badge badge-gray">{r.targetType}</span></td>
                    <td data-label="Reason" style={{ maxWidth: 180, color: 'var(--nw-gray-600)', fontSize: '0.875rem' }}>{r.reason}</td>
                    <td data-label="Reporter" style={{ fontSize: '0.875rem' }}>{r.reporter?.name}</td>
                    <td data-label="Target" style={{ fontSize: '0.875rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.targetName || '—'}</td>
                    <td data-label="Date" style={{ color: 'var(--nw-gray-500)', fontSize: '0.8125rem' }}>{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</td>
                    <td data-label="Status"><span className={`badge ${r.status === 'open' ? 'badge-accent' : 'badge-green'}`}>{r.status}</span></td>
                    <td data-label="Actions">
                      {r.status === 'open' && (
                        <div className="admin-row-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => resolve(r._id, 'dismiss', r.targetType, r.targetId)}>Dismiss</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => resolve(r._id, 'warn', r.targetType, r.targetId)}>Warn</button>
                          <button className="btn btn-danger btn-sm" onClick={() => resolve(r._id, 'remove', r.targetType, r.targetId)}>Remove</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminAPI.getLogs().then(({ data }) => setLogs(data.logs || [])).catch(() => {}).finally(() => setLoading(false)) }, [])

  return (
    <div>
      <h1 className="admin-page-title">Audit Logs</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Admin</th><th>Action</th><th>Target</th><th>Details</th><th>IP</th><th>Date</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td data-label="Admin">
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{log.admin?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--nw-gray-500)' }}>{log.admin?.role}</div>
                    </td>
                    <td data-label="Action"><span className="badge badge-primary">{log.action}</span></td>
                    <td data-label="Target" style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem', maxWidth: 160 }}>{log.target}</td>
                    <td data-label="Details" style={{ color: 'var(--nw-gray-600)', fontSize: '0.8125rem', maxWidth: 200 }}>{log.details}</td>
                    <td data-label="IP" style={{ color: 'var(--nw-gray-400)', fontSize: '0.8125rem', fontFamily: 'monospace' }}>{log.ip}</td>
                    <td data-label="Date" style={{ color: 'var(--nw-gray-500)', fontSize: '0.8125rem' }}>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
