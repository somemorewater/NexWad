import { useEffect, useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { listingsAPI, postsAPI, lostFoundAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import { SocketContext } from '../context/SocketContext'
import { isPremiumBuyer } from '../utils/roleRouting'

export default function BuyerHub() {
  const { user } = useAuth()
  const { unreadCount } = useContext(SocketContext)
  const navigate = useNavigate()
  const [preview, setPreview] = useState({ listings: [], posts: [], items: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listingsAPI.getAll({ page: 1, limit: 3 }),
      postsAPI.getFeed({ page: 1, limit: 3 }),
      lostFoundAPI.getAll({ limit: 3 }),
    ])
      .then(([marketRes, socialRes, lfRes]) => {
        setPreview({
          listings: marketRes?.data?.listings || [],
          posts: socialRes?.data?.posts || [],
          items: lfRes?.data?.items || [],
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const premium = isPremiumBuyer(user)

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header">
            <h1 className="page-header__title">
              Buyer Hub {premium && <span className="badge badge-primary" style={{ marginLeft: 8 }}>Premium</span>}
            </h1>
            <p className="page-header__sub">Your central space for discovering listings, updates, and campus activity.</p>
            <div className="what-this-means" style={{ maxWidth: 760 }}>
              <strong>What this means:</strong> This is your main buyer page. Use shortcuts for quick actions, and preview cards to jump into
              full Marketplace, Social, and Lost & Found pages.
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
            <ShortcutCard
              title="Marketplace"
              subtitle="Explore products and services"
              action="Open Marketplace"
              onClick={() => navigate('/marketplace')}
              iconClass="fa-solid fa-store"
            />
            <ShortcutCard
              title="Wishlist"
              subtitle="View your saved items"
              action="Open Wishlist"
              onClick={() => navigate('/marketplace?saved=true')}
              iconClass="fa-solid fa-heart"
            />
            <ShortcutCard
              title="Notifications"
              subtitle={`${unreadCount || 0} unread updates`}
              action="Open Messages"
              onClick={() => navigate('/chat')}
              iconClass="fa-solid fa-bell"
            />
          </div>

          {!premium && (
            <div className="card card-body" style={{ marginBottom: 'var(--space-6)', background: 'linear-gradient(135deg, var(--nw-ink) 0%, var(--nw-ink-soft) 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 4 }}>
                    Upgrade to Premium Buyer
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Unlock better visibility, priority support, and premium buyer perks.
                  </p>
                </div>
                <button className="btn" style={{ background: 'var(--nw-gold)', color: 'white' }} onClick={() => navigate('/profile/subscription')}>
                  Upgrade Now
                </button>
              </div>
            </div>
          )}

          {premium && (
            <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 'var(--space-3)' }}>Premium Perks</h2>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">Priority responses</span>
                <span className="badge badge-primary">Enhanced visibility</span>
                <span className="badge badge-primary">Exclusive buyer deals</span>
              </div>
            </div>
          )}

          <div className="grid-3" style={{ gap: 'var(--space-5)' }}>
            <PreviewSection
              title="Marketplace Preview"
              linkTo="/marketplace"
              emptyText="No active listings yet."
              loading={loading}
              items={preview.listings}
              renderItem={(item) => (
                <div key={item._id} className="hub-preview__item">
                  <div className="hub-preview__title">{item.title}</div>
                  <div className="hub-preview__meta">₦{(item.price || 0).toLocaleString()} · {item.category || 'General'}</div>
                </div>
              )}
            />

            <PreviewSection
              title="Social Feed Preview"
              linkTo="/social"
              emptyText="No posts yet."
              loading={loading}
              items={preview.posts}
              renderItem={(item) => (
                <div key={item._id} className="hub-preview__item">
                  <div className="hub-preview__title">{item.author?.name || 'Student'}</div>
                  <div className="hub-preview__meta">{String(item.content || '').slice(0, 72) || 'No text content'}</div>
                </div>
              )}
            />

            <PreviewSection
              title="Lost & Found Preview"
              linkTo="/lost-found"
              emptyText="No reports yet."
              loading={loading}
              items={preview.items}
              renderItem={(item) => (
                <div key={item._id} className="hub-preview__item">
                  <div className="hub-preview__title">{item.title}</div>
                  <div className="hub-preview__meta">{item.type || 'item'} · {item.location || 'Unknown location'}</div>
                </div>
              )}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

function ShortcutCard({ title, subtitle, action, onClick, iconClass }) {
  return (
    <button type="button" className="card card-body" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={onClick}>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--nw-primary-light)', color: 'var(--nw-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
        <i className={iconClass} aria-hidden="true" />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{title}</div>
      <div style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem', marginTop: 2 }}>{subtitle}</div>
      <div style={{ marginTop: 'var(--space-3)', color: 'var(--nw-primary)', fontWeight: 600, fontSize: '0.875rem' }}>{action}</div>
    </button>
  )
}

function PreviewSection({ title, linkTo, emptyText, loading, items, renderItem }) {
  return (
    <div className="card card-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{title}</h2>
        <Link to={linkTo} className="btn btn-ghost btn-sm">View all</Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2, 3].map(n => <div key={n} className="skeleton" style={{ height: 62, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{emptyText}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {items.map(renderItem)}
        </div>
      )}
    </div>
  )
}
