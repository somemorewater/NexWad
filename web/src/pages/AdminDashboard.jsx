import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { adminAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function AdminDashboard() {
  const { user } = useAuth()
  const adminNavItems = [
    { to: '/admin', label: 'Overview', end: true },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/listings', label: 'Listings' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/logs', label: 'Audit Logs' },
  ]

  return (
    <div>
      <Navbar />
      <div style={{ paddingTop: 'var(--nav-height)', display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh' }}>
        <aside style={{ background: 'var(--nw-ink)', padding: 'var(--space-6) var(--space-3)', position: 'sticky', top: 'var(--nav-height)', height: 'calc(100vh - var(--nav-height))', overflowY: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', padding: '0 12px 16px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Panel</div>
          {adminNavItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius-md)', color: isActive ? 'white' : 'rgba(255,255,255,0.5)', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', fontSize: '0.9rem', fontWeight: isActive ? 600 : 400, marginBottom: 2, transition: 'all 0.15s', textDecoration: 'none' })}
            >{item.label}</NavLink>
          ))}
          <div style={{ marginTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, padding: '16px 12px 0' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Signed in as</div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{user?.role?.replace('_', ' ')}</div>
          </div>
        </aside>
        <main style={{ padding: 'var(--space-8)', background: 'var(--nw-surface)' }}>
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/listings" element={<AdminListings />} />
            <Route path="/reports" element={<AdminReports />} />
            <Route path="/logs" element={<AdminLogs />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, textColor }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="stat-card__icon" style={{ background: color, color: textColor, fontSize: '1.2rem' }}>{icon}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  )
}

function AdminOverview() {
  const [stats, setStats] = useState(null)
  useEffect(() => { adminAPI.getStats().then(({ data }) => setStats(data)).catch(() => {}) }, [])

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 'var(--space-8)' }}>Platform Overview</h1>
      {!stats ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: 'var(--space-8)' }}>
            <StatCard icon="👥" label="Total Users" value={stats.totalUsers?.toLocaleString()} color="var(--nw-primary-light)" textColor="var(--nw-primary)" />
            <StatCard icon="🛒" label="Active Listings" value={stats.activeListings?.toLocaleString()} color="var(--nw-accent-light)" textColor="var(--nw-accent)" />
            <StatCard icon="💰" label="Total Revenue" value={`₦${(stats.totalRevenue||0).toLocaleString()}`} color="var(--nw-green-light)" textColor="var(--nw-green)" />
            <StatCard icon="🚩" label="Open Reports" value={stats.openReports} color="var(--nw-red-light)" textColor="var(--nw-red)" />
            <StatCard icon="⭐" label="Premium Users" value={stats.premiumUsers} color="var(--nw-gold-light)" textColor="#92400e" />
            <StatCard icon="🔍" label="Active Lost Items" value={stats.activeLostFound} color="var(--nw-gray-100)" textColor="var(--nw-gray-600)" />
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--nw-gray-100)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Recent Registrations</h3>
            </div>
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Joined</th><th>Plan</th></tr></thead>
              <tbody>
                {(stats.recentUsers || []).map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{u.email}</td>
                    <td style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{u.department}</td>
                    <td style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</td>
                    <td><span className="badge badge-primary">{u.subscription?.plan || 'basic'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      adminAPI.getUsers({ q }).then(({ data }) => setUsers(data.users || [])).catch(() => {}).finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const ban = async (userId, name) => {
    if (!confirm(`Ban ${name}?`)) return
    try { await adminAPI.banUser(userId, 'Admin action'); setUsers(p => p.map(u => u._id === userId ? { ...u, banned: true } : u)); toast.success('User banned') }
    catch { toast.error('Failed') }
  }

  const unban = async (userId) => {
    try { await adminAPI.unbanUser(userId); setUsers(p => p.map(u => u._id === userId ? { ...u, banned: false } : u)); toast.success('Unbanned') }
    catch { toast.error('Failed') }
  }

  const changeRole = async (userId, role) => {
    try { await adminAPI.updateUserRole(userId, role); setUsers(p => p.map(u => u._id === userId ? { ...u, role } : u)); toast.success('Role updated') }
    catch { toast.error('Failed') }
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 'var(--space-6)' }}>User Management</h1>
      <input type="text" className="form-input" placeholder="Search by name, email, or matric…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 380, marginBottom: 'var(--space-5)' }} />
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div> : (
          <table className="admin-table">
            <thead><tr><th>User</th><th>Matric</th><th>Role</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', borderRadius: '50%' }} /> : u.name?.[0]}</div>
                      <div><div style={{ fontWeight: 500 }}>{u.name}</div><div style={{ fontSize: '0.8125rem', color: 'var(--nw-gray-500)' }}>{u.email}</div></div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{u.matricNumber}</td>
                  <td>
                    <select value={u.role || 'user'} onChange={e => changeRole(u._id, e.target.value)} style={{ border: '1px solid var(--nw-gray-200)', borderRadius: 6, padding: '4px 8px', fontSize: '0.8125rem', fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}>
                      {['user', 'cs', 'moderator', 'admin', 'super_admin'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td><span className="badge badge-primary">{u.subscription?.plan || 'basic'}</span></td>
                  <td><span className={`badge ${u.banned ? 'badge-red' : 'badge-green'}`}>{u.banned ? 'Banned' : 'Active'}</span></td>
                  <td>
                    {u.banned
                      ? <button className="btn btn-ghost btn-sm" onClick={() => unban(u._id)}>Unban</button>
                      : <button className="btn btn-danger btn-sm" onClick={() => ban(u._id, u.name)}>Ban</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 'var(--space-6)' }}>Listings</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div> : (
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Seller</th><th>Price</th><th>Category</th><th>Status</th><th>Featured</th></tr></thead>
            <tbody>
              {listings.map(l => (
                <tr key={l._id}>
                  <td style={{ fontWeight: 500, maxWidth: 200 }}>{l.title}</td>
                  <td style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{l.seller?.name}</td>
                  <td style={{ fontWeight: 600 }}>₦{l.price?.toLocaleString()}</td>
                  <td><span className="badge badge-gray">{l.category}</span></td>
                  <td><span className={`badge ${l.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{l.status}</span></td>
                  <td><button className={`btn btn-sm ${l.isPremium ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => toggle(l._id, l.isPremium)}>{l.isPremium ? '★ Featured' : 'Feature'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 'var(--space-6)' }}>Reports</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div> : (
          <table className="admin-table">
            <thead><tr><th>Type</th><th>Reason</th><th>Reporter</th><th>Target</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {reports.map(r => (
                <tr key={r._id}>
                  <td><span className="badge badge-gray">{r.targetType}</span></td>
                  <td style={{ maxWidth: 180, color: 'var(--nw-gray-600)', fontSize: '0.875rem' }}>{r.reason}</td>
                  <td style={{ fontSize: '0.875rem' }}>{r.reporter?.name}</td>
                  <td style={{ fontSize: '0.875rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.targetName || '—'}</td>
                  <td style={{ color: 'var(--nw-gray-500)', fontSize: '0.8125rem' }}>{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</td>
                  <td><span className={`badge ${r.status === 'open' ? 'badge-accent' : 'badge-green'}`}>{r.status}</span></td>
                  <td>
                    {r.status === 'open' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => resolve(r._id, 'dismiss', r.targetType, r.targetId)}>Dismiss</button>
                        <button className="btn btn-danger btn-sm" onClick={() => resolve(r._id, 'remove', r.targetType, r.targetId)}>Remove</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 'var(--space-6)' }}>Audit Logs</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div> : (
          <table className="admin-table">
            <thead><tr><th>Admin</th><th>Action</th><th>Target</th><th>Details</th><th>IP</th><th>Date</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{log.admin?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--nw-gray-500)' }}>{log.admin?.role}</div>
                  </td>
                  <td><span className="badge badge-primary">{log.action}</span></td>
                  <td style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem', maxWidth: 160 }}>{log.target}</td>
                  <td style={{ color: 'var(--nw-gray-600)', fontSize: '0.8125rem', maxWidth: 200 }}>{log.details}</td>
                  <td style={{ color: 'var(--nw-gray-400)', fontSize: '0.8125rem', fontFamily: 'monospace' }}>{log.ip}</td>
                  <td style={{ color: 'var(--nw-gray-500)', fontSize: '0.8125rem' }}>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
