import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import nexwadLogo from '../assets/images/nexwad-logo-full.png'

const DEPARTMENTS = [
  'Computer Engineering', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Chemical Engineering', 'Aerospace Engineering',
  'Cyber Security', 'Information Technology',
]

const LEVELS = ['100', '200', '300', '400', '500']

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1: account, 2: student info, 3: OTP
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    matricNumber: '', department: '', level: '', phone: '',
  })
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const getErrorMessage = (err, fallback) => {
    if (err?.error) return err.error
    if (Array.isArray(err?.details) && err.details.length > 0) {
      return err.details[0]?.message || fallback
    }
    return err?.message || fallback
  }

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const validateStep1 = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const validateStep2 = () => {
    const e = {}
    if (!form.matricNumber.trim()) e.matricNumber = 'Matric number required'
    if (!form.department) e.department = 'Department required'
    if (!form.level) e.level = 'Level required'
    return e
  }

  const handleStep1 = (e) => {
    e.preventDefault()
    const e2 = validateStep1()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setStep(2)
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    const e2 = validateStep2()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    try {
      await signup({ ...form, _step: 'initiate' })
      setStep(3)
      toast.success('OTP sent to your email')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleOtpVerify = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) { setErrors({ otp: 'Enter the 6-digit code' }); return }
    setLoading(true)
    try {
      await signup({ ...form, otp, _step: 'verify' })
      toast.success('Account created! Welcome to NexWAD')
      navigate('/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid OTP'))
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = ['Account', 'Student Info', 'Verify']

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-left__logo">
          <img src={nexwadLogo} alt="NexWAD Logo" />
        </div>
        <div className="auth-left__content">
          <h2 className="auth-left__headline">
            Join your<br />campus network.
          </h2>
          <p className="auth-left__sub">
            Create your NexWAD account and gain access to the full AFIT student ecosystem.
          </p>
        </div>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 12 }}>
          {stepLabels.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step > i ? 'var(--nw-green)' : step === i + 1 ? 'var(--nw-primary)' : 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: 'white',
                transition: 'background 0.3s',
              }}>
                {step > i ? <i className="fa-solid fa-check" aria-hidden="true" /> : i + 1}
              </div>
              <span style={{ color: step === i + 1 ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '0.875rem', fontWeight: step === i + 1 ? 600 : 400 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap animate-fade-in">
          {step === 1 && (
            <>
              <h2>Create account</h2>
              <p>Use your email to create an account</p>
              <form className="auth-form" onSubmit={handleStep1}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={set('name')} />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={set('email')} />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" className="form-input" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} />
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
                  Continue →
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Student Details</h2>
              <p>We verify this against AFIT records</p>
              <form className="auth-form" onSubmit={handleStep2}>
                <div className="form-group">
                  <label className="form-label">Matric Number</label>
                  <input type="text" className="form-input" placeholder="AFIT/ICE/20/001" value={form.matricNumber} onChange={set('matricNumber')} />
                  {errors.matricNumber && <span className="form-error">{errors.matricNumber}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={form.department} onChange={set('department')}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                  {errors.department && <span className="form-error">{errors.department}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select className="form-select" value={form.level} onChange={set('level')}>
                    <option value="">Select level</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}L</option>)}
                  </select>
                  {errors.level && <span className="form-error">{errors.level}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (optional)</label>
                  <input type="tel" className="form-input" placeholder="+234 800 000 0000" value={form.phone} onChange={set('phone')} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '14px' }} onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '14px' }} disabled={loading}>
                    {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Send OTP →'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Verify Email</h2>
              <p>Enter the 6-digit code sent to <strong>{form.email}</strong></p>
              <form className="auth-form" onSubmit={handleOtpVerify}>
                <div className="form-group">
                  <label className="form-label">OTP Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="123456"
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}) }}
                    style={{ fontSize: '1.5rem', letterSpacing: '0.25em', textAlign: 'center' }}
                    maxLength={6}
                    autoFocus
                  />
                  {errors.otp && <span className="form-error">{errors.otp}</span>}
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <><i className="fa-solid fa-circle-check" aria-hidden="true" /> Verify & Join NexWAD</>}
                </button>
                <p className="auth-footer" style={{ marginTop: 12 }}>
                  Didn't receive it?{' '}
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--nw-primary)', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
                    Resend OTP
                  </button>
                </p>
              </form>
            </>
          )}

          {step < 3 && (
            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
