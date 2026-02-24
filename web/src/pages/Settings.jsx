import { useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { usersAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, updateUser, logout } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    department: user?.department || '',
    level: user?.level || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await usersAPI.updateProfile(form)
      updateUser(data.user)
      toast.success('Settings updated')
    } catch (err) {
      toast.error(err?.message || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header">
            <h1 className="page-header__title">Settings</h1>
            <p className="page-header__sub">Manage your profile details</p>
          </div>

          <div className="card card-body" style={{ maxWidth: 720 }}>
            <form onSubmit={saveProfile} style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={set('name')} />
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={set('department')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select className="form-select" value={form.level} onChange={set('level')}>
                    <option value="">Select level</option>
                    {['100', '200', '300', '400', '500'].map((v) => (
                      <option key={v} value={v}>{v}L</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+234..." />
              </div>

              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-textarea" rows={4} value={form.bio} onChange={set('bio')} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={logout}>
                  Sign Out
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

