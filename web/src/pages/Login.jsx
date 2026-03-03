import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import nexwadLogo from '../assets/images/nexwad-logo-full.png'
import { getDefaultRouteForUser } from '../utils/roleRouting'

export default function Login() {
  const { login, user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const requestedPath = location.state?.from?.pathname
  const from = requestedPath && requestedPath !== '/login' ? requestedPath : null

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const getErrorMessage = (err, fallback) => {
    if (err?.error) return err.error
    if (Array.isArray(err?.details) && err.details.length > 0) {
      return err.details[0]?.message || fallback
    }
    return err?.message || fallback
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from || getDefaultRouteForUser(user), { replace: true })
    }
  }, [authLoading, isAuthenticated, from, navigate, user])

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email, username, or matric number is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    try {
      const data = await login({ ...form, email: form.email.trim() })
      toast.success('Welcome back!')
      navigate(from || getDefaultRouteForUser(data?.user), { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid credentials'))
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  return (
    <div className="auth-layout">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left__logo">
          <img src={nexwadLogo} alt="NexWAD Logo" />
        </div>
        <div className="auth-left__content">
          <h2 className="auth-left__headline">
            Welcome back to<br />campus life.
          </h2>
          <p className="auth-left__sub">
            Your marketplace, social hub, and campus companion — all in one place.
          </p>
        </div>
        <div className="auth-left__features">
          {[
            'Buy & sell textbooks, gadgets, essentials',
            'Find lost items with real-time alerts',
            'Chat directly with sellers on campus',
            'Share your campus moments',
          ].map(f => (
            <div key={f} className="auth-feature">
              <div className="auth-feature__icon">
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-wrap animate-fade-in">
          <h2>Sign in</h2>
          <p>Use your email, username, or matric number</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email, Username, or Matric Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="username"
                autoFocus
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                <Link to="/forgot-password" style={{ color: 'var(--nw-primary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  Forgot?
                </Link>
              </label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-field__input"
                  placeholder="Your password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-field__toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '0.9375rem', marginTop: 'var(--space-2)' }}
              disabled={loading}
            >
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
          <p className="auth-footer" style={{ marginTop: 10 }}>
            <Link to="/legal">Legal Policies</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
