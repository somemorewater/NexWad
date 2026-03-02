import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { listingsAPI } from '../api/endpoints'
import { ListingCard } from '../components/Card'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  const isSeller = user?.role === 'seller'
  if (!isSeller) return <Navigate to="/home" replace />

  useEffect(() => {
    listingsAPI.getMyListings()
      .then(({ data }) => setListings(data.listings || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activeListings = listings.filter(l => l.status === 'active')
  const expiredListings = listings.filter(l => l.status === 'expired')
  const pinnedListings = listings.filter(l => l.isPremium || l.pinned)
  const totalViews = listings.reduce((acc, l) => acc + (l.views || 0), 0)
  const revenueOverview = activeListings.reduce((acc, l) => acc + (l.price || 0), 0)
  const subscriptionStatus = user?.subscription?.plan
    ? `${String(user.subscription.plan).replace('_', ' ')}`
    : 'No active seller plan'

  const analytics = [
    { label: 'Active Listings', value: activeListings.length, icon: 'fa-solid fa-store', color: 'var(--nw-primary)' },
    { label: 'Expired Listings', value: expiredListings.length, icon: 'fa-solid fa-clock-rotate-left', color: 'var(--nw-accent)' },
    { label: 'Pins in Use', value: pinnedListings.length, icon: 'fa-solid fa-thumbtack', color: 'var(--nw-gold)' },
    { label: 'Total Views', value: totalViews, icon: 'fa-solid fa-eye', color: 'var(--nw-green)' },
    { label: 'Revenue Overview', value: `₦${revenueOverview.toLocaleString()}`, icon: 'fa-solid fa-naira-sign', color: 'var(--nw-primary)' },
    { label: 'Subscription Status', value: subscriptionStatus, icon: 'fa-solid fa-crown', color: 'var(--nw-accent)' },
  ]

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header">
            <h1 className="page-header__title">Seller Dashboard</h1>
            <p className="page-header__sub">Manage your store performance, listings, pins, and subscription in one place.</p>
            <div className="what-this-means" style={{ maxWidth: 700 }}>
              <strong>What this means:</strong> This page is only for approved sellers. The cards below summarize your current seller performance
              and help you decide when to renew, pin, or create new listings.
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
            {analytics.map((item) => (
              <div key={item.label} className="card card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'var(--nw-gray-100)', color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={item.icon} aria-hidden="true" />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{item.label}</div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--nw-ink)' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 'var(--space-3)' }}>Seller Controls</h2>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate('/marketplace?create=true')}>
                + New Listing
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/marketplace?mine=true')}>
                Manage Listings
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/profile/subscription')}>
                Pin Management
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/profile/subscription')}>
                Subscription Status
              </button>
            </div>
          </div>

          <Section
            title="Active Listings"
            loading={loading}
            items={activeListings}
            emptyText="No active listings yet."
            onViewAll={() => navigate('/marketplace?mine=true')}
          />

          <Section
            title="Expired Listings"
            loading={loading}
            items={expiredListings}
            emptyText="No expired listings."
            onViewAll={() => navigate('/marketplace?mine=true')}
          />
        </main>
      </div>
    </div>
  )
}

function Section({ title, loading, items, emptyText, onViewAll }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{title}</h2>
        <button className="btn btn-ghost btn-sm" onClick={onViewAll}>View all</button>
      </div>

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-xl)' }} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">{emptyText}</div>
        </div>
      ) : (
        <div className="grid-3">
          {items.slice(0, 6).map(item => <ListingCard key={item._id} listing={item} />)}
        </div>
      )}
    </div>
  )
}
