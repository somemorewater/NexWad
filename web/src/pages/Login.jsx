import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email or matric number is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    try {
      await login(form)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err?.message || 'Invalid credentials')
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
        <div className="auth-left__logo">NexWAD<span style={{ color: 'var(--nw-accent)', marginLeft: 4 }}>·</span></div>
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
          <p>AFIT students only · Use your school email</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Matric Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="student@afit.edu.ng"
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
              <input
                type="password"
                className="form-input"
                placeholder="Your password"
                value={form.password}
                onChange={set('password')}
                autoComplete="current-password"
              />
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
        </div>
      </div>
    </div>
  )
}
