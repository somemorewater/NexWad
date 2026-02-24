import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

const features = [
  {
    icon: '🛒',
    title: 'Student Marketplace',
    desc: 'Buy and sell textbooks, electronics, hostel essentials — all within AFIT.',
    color: 'var(--nw-primary-light)',
  },
  {
    icon: '💬',
    title: 'Social Feed',
    desc: 'Share campus moments, connect with coursemates, and discover campus news.',
    color: 'var(--nw-accent-light)',
  },
  {
    icon: '🔍',
    title: 'Lost & Found',
    desc: 'Report a lost item or help someone find theirs. Real-time alerts.',
    color: 'var(--nw-green-light)',
  },
  {
    icon: '⚡',
    title: 'Real-time Chat',
    desc: 'Message sellers directly. Negotiate, confirm, and transact safely.',
    color: 'var(--nw-gold-light)',
  },
]

const stats = [
  { value: '2,400+', label: 'Active Students' },
  { value: '₦12M+', label: 'Transactions' },
  { value: '800+', label: 'Listings Monthly' },
  { value: '98%', label: 'Happy Traders' },
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nw-surface)' }}>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-height)' }}>
        {/* Hero */}
        <section className="hero">
          <div className="container">
            <div className="hero__eyebrow animate-fade-in">
              <span>🎓</span> AFIT Kaduna's Student Platform
            </div>
            <h1 className="hero__title animate-fade-in delay-1">
              Your campus.<br />
              <em>One platform.</em>
            </h1>
            <p className="hero__subtitle animate-fade-in delay-2">
              NexWAD connects AFIT students to buy, sell, find lost items,
              and share campus life — all in one place.
            </p>
            <div className="hero__actions animate-fade-in delay-3">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="container">
          <div className="stats-strip">
            {stats.map(s => (
              <div key={s.value} className="stat-item animate-fade-in">
                <div className="stat-item__value">{s.value}</div>
                <div className="stat-item__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <section style={{ padding: 'var(--space-16) 0', background: 'var(--nw-white)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <span className="label" style={{ color: 'var(--nw-primary)' }}>What you get</span>
              <h2 className="display-md" style={{ marginTop: 'var(--space-3)' }}>
                Everything campus life needs
              </h2>
            </div>
            <div className="grid-2" style={{ gap: 'var(--space-5)' }}>
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="card card-body animate-fade-in"
                  style={{ animationDelay: `${i * 0.08}s`, display: 'flex', gap: 'var(--space-5)', padding: 'var(--space-8)' }}
                >
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 'var(--radius-xl)',
                    background: f.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0,
                  }}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.0625rem', marginBottom: 'var(--space-2)' }}>
                      {f.title}
                    </h3>
                    <p style={{ color: 'var(--nw-gray-500)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{
          padding: 'var(--space-20) 0',
          background: 'var(--nw-ink)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(37,99,255,0.2) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
          <div className="container" style={{ position: 'relative' }}>
            <h2 className="display-lg" style={{ color: 'white', marginBottom: 'var(--space-5)' }}>
              Join 2,400+ AFIT students
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.0625rem', marginBottom: 'var(--space-10)', maxWidth: 460, margin: '0 auto var(--space-10)' }}>
              Sign up with any valid email and start buying, selling, and connecting today.
            </p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Create Free Account
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          background: 'var(--nw-ink-soft)',
          padding: 'var(--space-10) 0',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>NexWAD</span>
              {' '}· Built for AFIT students · {new Date().getFullYear()}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
              {['Privacy', 'Terms', 'Safety'].map(l => (
                <span key={l} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', cursor: 'pointer' }}>{l}</span>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
