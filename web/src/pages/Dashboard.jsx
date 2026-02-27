import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { listingsAPI } from '../api/endpoints'
import { ListingCard } from '../components/Card'

function TrendUp() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
function TrendDown() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg> }

export default function Dashboard() {
  const { user } = useAuth()
  const canSell = user?.role === 'seller'
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listingsAPI.getMyListings()
      .then(({ data }) => setListings(data.listings || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    {
      label: 'Active Listings',
      value: listings.filter(l => l.status === 'active').length,
      change: '+2 this week',
      up: true,
      iconClass: 'fa-solid fa-cart-shopping',
      color: 'var(--nw-primary-light)',
      iconColor: 'var(--nw-primary)',
    },
    {
      label: 'Total Views',
      value: listings.reduce((a, l) => a + (l.views || 0), 0),
      change: '+12% this week',
      up: true,
      iconClass: 'fa-solid fa-eye',
      color: 'var(--nw-accent-light)',
      iconColor: 'var(--nw-accent)',
    },
    {
      label: 'Messages',
      value: user?.unreadMessages || 0,
      change: 'Click to view',
      up: null,
      iconClass: 'fa-solid fa-comments',
      color: 'var(--nw-green-light)',
      iconColor: 'var(--nw-green)',
    },
    {
      label: 'Saved Items',
      value: user?.savedCount || 0,
      change: 'Across all categories',
      up: null,
      iconClass: 'fa-solid fa-heart',
      color: 'var(--nw-gold-light)',
      iconColor: 'var(--nw-gold)',
    },
  ]

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          {/* Welcome */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--nw-ink)',
              letterSpacing: '-0.015em',
              marginBottom: 4,
            }}>
              Good {getTimeGreeting()}, {user?.name?.split(' ')[0]} <i className="fa-solid fa-hand" aria-hidden="true" />
            </h1>
            <p style={{ color: 'var(--nw-gray-500)' }}>Here's what's happening on NexWAD</p>
          </div>

          {/* Stats */}
          <div className="grid-4" style={{ marginBottom: 'var(--space-8)' }}>
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="stat-card animate-fade-in"
                style={{ animationDelay: `${i * 0.06}s`, cursor: s.label === 'Messages' ? 'pointer' : 'default' }}
                onClick={s.label === 'Messages' ? () => navigate('/chat') : undefined}
              >
                <div className="stat-card__icon" style={{ background: s.color, color: s.iconColor, fontSize: '1.25rem' }}>
                  <i className={s.iconClass} aria-hidden="true" />
                </div>
                <div className="stat-card__value">{s.value.toLocaleString()}</div>
                <div className="stat-card__label">{s.label}</div>
                {s.up !== null && (
                  <div className={`stat-card__change stat-card__change--${s.up ? 'up' : 'down'}`}>
                    {s.up ? <TrendUp /> : <TrendDown />}
                    {s.change}
                  </div>
                )}
                {s.up === null && (
                  <div className="stat-card__change" style={{ color: 'var(--nw-gray-400)' }}>{s.change}</div>
                )}
              </div>
            ))}
          </div>

          {/* Subscription banner */}
          {!user?.subscription && (
            <div style={{
              background: 'linear-gradient(135deg, var(--nw-ink) 0%, var(--nw-ink-soft) 100%)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-6) var(--space-8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-8)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(37,99,255,0.25), transparent)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.0625rem', color: 'white', marginBottom: 4 }}>
                  <i className="fa-solid fa-star" aria-hidden="true" /> Upgrade to NexWAD Premium
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                  Get premium listing placement, seller analytics & more
                </div>
              </div>
              <button
                className="btn"
                style={{ background: 'var(--nw-gold)', color: 'white', flexShrink: 0 }}
                onClick={() => navigate('/profile/subscription')}
              >
                Upgrade Now
              </button>
            </div>
          )}

          {/* My Listings */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem' }}>My Listings</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/marketplace?mine=true')}>View All</button>
                {canSell && <button className="btn btn-primary btn-sm" onClick={() => navigate('/marketplace?create=true')}>+ New Listing</button>}
              </div>
            </div>

            {loading ? (
              <div className="grid-3">
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-xl)' }} />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon" style={{ fontSize: '2rem' }}><i className="fa-solid fa-box-open" aria-hidden="true" /></div>
                <div className="empty-state__title">No listings yet</div>
                <div className="empty-state__text">Start selling to fellow students on NexWAD</div>
                {canSell && (
                  <button className="btn btn-primary" onClick={() => navigate('/marketplace?create=true')}>
                    Create First Listing
                  </button>
                )}
              </div>
            ) : (
              <div className="grid-3">
                {listings.slice(0, 6).map(l => <ListingCard key={l._id} listing={l} />)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
