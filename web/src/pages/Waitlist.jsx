import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import nexwadLogoFull from '../assets/images/nexwad-logo-full.png'
import { waitlistAPI } from '../api/endpoints'

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'seller', label: 'Seller' },
  { value: 'community', label: 'Community Lead' },
  { value: 'brand', label: 'Brand Partner' },
]

export default function Waitlist() {
  const waitlistEnabled = String(import.meta.env.VITE_WAITLIST ?? import.meta.env.WAITLIST ?? 'true').toLowerCase() !== 'false'
  const [formState, setFormState] = useState({
    fullName: '',
    email: '',
    campus: '',
    role: ROLE_OPTIONS[0].value,
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const intakeSummary = useMemo(() => {
    const parts = [formState.fullName, formState.campus].filter(Boolean)
    if (!parts.length) return 'Tell us a little about you so we can prioritize early access.'
    return `We will tailor your onboarding for ${parts.join(' • ')}.`
  }, [formState.fullName, formState.campus])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setFormState({
      fullName: '',
      email: '',
      campus: '',
      role: ROLE_OPTIONS[0].value,
    })
    setSubmitMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!waitlistEnabled) {
      toast.error('Waitlist is currently inactive')
      return
    }
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const payload = { ...formState, source: 'waitlist_page' }
      const { data } = await waitlistAPI.join(payload)
      setSubmitted(true)
      const message = data?.created ? 'You are on the waitlist!' : (data?.message || 'You are already on the list.')
      setSubmitMessage(message)
      toast.success(message)
    } catch (err) {
      const msg = err?.error || err?.message || 'Unable to join the waitlist'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="waitlist-page">
      <div className="waitlist-shell">
        <header className="waitlist-header">
          <Link to="/" className="waitlist-logo" aria-label="NexWAD home">
            <img src={nexwadLogoFull} alt="NexWAD" />
          </Link>
          <div className="waitlist-header__actions">
            <Link to="/" className="btn btn-ghost">Back to Home</Link>
            <Link to="/login" className="btn btn-secondary">Log in</Link>
          </div>
        </header>

        <main className="waitlist-grid">
          <section className="waitlist-hero">
            <span className="waitlist-kicker">Campus commerce. Community. Care.</span>
            <h1 className="waitlist-title">
              Join the NexWAD waitlist for the first campus-first marketplace.
            </h1>
            <p className="waitlist-subtitle">
              Be the first to shop, sell, and connect with verified campus communities. We are opening city by city
              with early access for the people who help us shape the experience.
            </p>

            <div className="waitlist-points">
              <div className="waitlist-point">
                <h3>Smart campus rollouts</h3>
                <p>Priority access is granted by school, role, and launch readiness.</p>
              </div>
              <div className="waitlist-point">
                <h3>Safety-first marketplace</h3>
                <p>Verified student profiles, secure meetups, and a support desk that knows your campus.</p>
              </div>
              <div className="waitlist-point">
                <h3>Community-powered perks</h3>
                <p>Be the first to test seller tools, loyalty drops, and local partner bundles.</p>
              </div>
            </div>

            <div className="waitlist-strip">
              <div>
                <p className="waitlist-strip__label">Early access waves</p>
                <p className="waitlist-strip__value">Launching in 10+ campuses</p>
              </div>
              <div>
                <p className="waitlist-strip__label">Priority</p>
                <p className="waitlist-strip__value">Students & campus orgs</p>
              </div>
              <div>
                <p className="waitlist-strip__label">Avg. access time</p>
                <p className="waitlist-strip__value">2-4 weeks</p>
              </div>
            </div>
          </section>

          <aside className="waitlist-card" aria-live="polite">
            <div className="waitlist-card__top">
              <p className="waitlist-card__eyebrow">Request early access</p>
              <h2>We will invite you the moment your campus opens.</h2>
              <p>{intakeSummary}</p>
              {!waitlistEnabled && (
                <div className="waitlist-inactive">
                  Waitlist signups are currently paused. Check back soon for the next intake wave.
                </div>
              )}
            </div>

            {submitted ? (
              <div className="waitlist-success">
                <h3>You're on the list!</h3>
                {submitMessage && <p>{submitMessage}</p>}
                <p>
                  We saved your spot. Expect a confirmation email and early access update soon.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setSubmitted(false)
                    resetForm()
                  }}
                >
                  Add another teammate
                </button>
              </div>
            ) : (
              <form className="waitlist-form" onSubmit={handleSubmit}>
                <label className="form-group">
                  <span className="form-label">Full name</span>
                  <input
                    className="form-input"
                    type="text"
                    name="fullName"
                    value={formState.fullName}
                    onChange={handleChange}
                    placeholder="Ada N."
                    required
                    disabled={!waitlistEnabled}
                  />
                </label>

                <label className="form-group">
                  <span className="form-label">Email address</span>
                  <input
                    className="form-input"
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    placeholder="you@youdomain.com"
                    required
                    disabled={!waitlistEnabled}
                  />
                </label>

                <label className="form-group">
                  <span className="form-label">City</span>
                  <input
                    className="form-input"
                    type="text"
                    name="campus"
                    value={formState.campus}
                    onChange={handleChange}
                    placeholder="Kaduna"
                    disabled={!waitlistEnabled}
                  />
                </label>

                <label className="form-group">
                  <span className="form-label">I am a</span>
                  <select
                    className="form-select"
                    name="role"
                    value={formState.role}
                    onChange={handleChange}
                    disabled={!waitlistEnabled}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button className="btn btn-primary btn-lg" type="submit" disabled={isSubmitting || !waitlistEnabled}>
                  {waitlistEnabled ? (isSubmitting ? 'Joining…' : 'Join the waitlist') : 'Waitlist closed'}
                </button>

                <p className="waitlist-fineprint">
                  By joining, you agree to receive launch updates. We will never share your info.
                </p>
              </form>
            )}

            <div className="waitlist-card__footer">
              <div className="waitlist-chip">Early seller perks</div>
              <div className="waitlist-chip">Founder Q&A invites</div>
              <div className="waitlist-chip">Campus ambassador track</div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
