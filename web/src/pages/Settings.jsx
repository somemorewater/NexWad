import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import toast from 'react-hot-toast'

export default function Settings() {
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const themeOptions = [
    { id: 'original', label: 'Original', desc: 'Current NexWAD look', colors: ['#2563ff', '#ff5c35', '#f5f4f0'] },
    { id: 'dark', label: 'Dark', desc: 'Low-light interface', colors: ['#6ea8ff', '#ff8e76', '#0b1020'] },
    { id: 'red', label: 'Red', desc: 'Bold warm palette', colors: ['#dc2626', '#fb7185', '#fef2f2'] },
    { id: 'blue', label: 'Blue', desc: 'Cool modern palette', colors: ['#2563eb', '#0ea5e9', '#eff6ff'] },
    { id: 'green', label: 'Green', desc: 'Fresh natural palette', colors: ['#15803d', '#0d9488', '#f0fdf4'] },
    { id: 'yellow', label: 'Yellow', desc: 'Bright energetic palette', colors: ['#b7791f', '#f59e0b', '#fffbeb'] },
  ]

  const applyTheme = (themeId) => {
    setTheme(themeId)
    toast.success(`${themeOptions.find(t => t.id === themeId)?.label || 'Theme'} theme selected`)
  }

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header">
            <h1 className="page-header__title">Settings</h1>
            <p className="page-header__sub">Personalize app theme and preferences</p>
          </div>

          <div className="card card-body" style={{ maxWidth: 920 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', marginBottom: 'var(--space-2)' }}>
              Theme
            </h2>
            <p style={{ color: 'var(--nw-gray-500)', marginBottom: 'var(--space-5)' }}>
              Choose how NexWAD looks across all pages.
            </p>

            <div className="theme-grid">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`theme-option ${theme === opt.id ? 'active' : ''}`}
                  onClick={() => applyTheme(opt.id)}
                >
                  <div className="theme-option__swatches">
                    {opt.colors.map((c) => (
                      <span key={c} style={{ background: c }} />
                    ))}
                  </div>
                  <div className="theme-option__meta">
                    <div className="theme-option__name">{opt.label}</div>
                    <div className="theme-option__desc">{opt.desc}</div>
                  </div>
                  {theme === opt.id && (
                    <span className="badge badge-primary">Active</span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => applyTheme('original')}>
                Reset to Original
              </button>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                Sign Out
              </button>
            </div>
          </div>

          <div className="card card-body" style={{ maxWidth: 920, marginTop: 'var(--space-5)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', marginBottom: 'var(--space-2)' }}>
              Account Details
            </h2>
            <p style={{ color: 'var(--nw-gray-500)' }}>
              Open Account Manager to edit your important account information.
            </p>
            <div style={{ marginTop: 'var(--space-4)' }}>
              <Link to="/profile/account-manager" className="btn btn-primary">
                Go to Account Manager
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
