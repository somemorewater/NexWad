import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import { useAuth } from '../hooks/useAuth'
import { listingsAPI, pinsAPI, postsAPI } from '../api/endpoints'
import { ListingCard } from '../components/Card'
import { formatPinTimeLeft, runPaystackCharge } from '../utils/pins'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { lostFoundCategoryIcon } from '../constants/categories'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [posts, setPosts] = useState([])
  const [activePins, setActivePins] = useState([])
  const [pinUsage, setPinUsage] = useState({ activeCount: 0, activeHoursRemaining: 0, credits: { balance: 0 } })
  const [loading, setLoading] = useState(true)
  const [pinActionId, setPinActionId] = useState(null)
  const [showPinPicker, setShowPinPicker] = useState(false)
  const [pinPickerType, setPinPickerType] = useState('listing')

  const isSeller = user?.role === 'seller'
  if (!isSeller) return <Navigate to="/home" replace />

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [listingsRes, pinsRes, postsRes] = await Promise.all([
        listingsAPI.getMyListings(),
        pinsAPI.getMine(),
        postsAPI.getMine(),
      ])
      setListings(listingsRes?.data?.listings || [])
      setActivePins(pinsRes?.data?.activePins || [])
      setPinUsage(pinsRes?.data?.usage || { activeCount: 0, activeHoursRemaining: 0, credits: { balance: 0 } })
      setPosts(postsRes?.data?.posts || [])
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const extendPin = async (pin) => {
    if (!pin?._id) return
    setPinActionId(`extend-${pin._id}`)
    try {
      await pinsAPI.extend(pin._id, { units: 1 })
      toast.success('Pin extended by 24 hours')
      await loadDashboardData()
    } catch (err) {
      if (err?.message === 'Payment window closed') toast('Payment window closed')
      else toast.error(err?.error || err?.message || 'Could not extend pin')
    } finally {
      setPinActionId(null)
    }
  }

  const unpin = async (pin) => {
    if (!pin?._id) return
    setPinActionId(`unpin-${pin._id}`)
    try {
      await pinsAPI.unpin(pin._id)
      toast.success('Unpinned')
      await loadDashboardData()
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not unpin')
    } finally {
      setPinActionId(null)
    }
  }

  const togglePostPin = async (post) => {
    const pin = post.pin
    const isPinned = Boolean(pin && new Date(pin.expiresAt).getTime() > Date.now())
    setPinActionId(`post-${post._id}`)
    try {
      if (isPinned) {
        await pinsAPI.unpin(pin._id)
        toast.success('Post unpinned')
      } else {
        const { data } = await pinsAPI.initialize({
          targetType: 'post',
          targetId: post._id,
          units: 1,
        })
        toast.success('Post pinned for 24 hours')
      }
      await loadDashboardData()
    } catch (err) {
      if (err?.message === 'Payment window closed') toast('Payment window closed')
      else toast.error(err?.error || err?.message || 'Could not update post pin')
    } finally {
      setPinActionId(null)
    }
  }

  const toggleListingPin = async (listing) => {
    const pin = listing.pin
    const isPinned = Boolean(pin && new Date(pin.expiresAt).getTime() > Date.now())
    setPinActionId(`listing-${listing._id}`)
    try {
      if (isPinned) {
        await pinsAPI.unpin(pin._id)
        toast.success('Product unpinned')
      } else {
        await pinsAPI.initialize({
          targetType: 'listing',
          targetId: listing._id,
          units: 1,
        })
        toast.success('Product pinned for 24 hours')
      }
      await loadDashboardData()
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not update product pin')
    } finally {
      setPinActionId(null)
    }
  }

  const buyCredits = async (units) => {
    const parsedUnits = Number.parseInt(units, 10)
    if (!Number.isInteger(parsedUnits) || parsedUnits < 1) {
      toast.error('Invalid credit amount')
      return
    }

    setPinActionId(`buy-${parsedUnits}`)
    try {
      const { data } = await pinsAPI.initializeCredits({ units: parsedUnits })
      await runPaystackCharge({
        publicKey: data?.payment?.publicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user?.email || 'user@nexwad.app',
        amountKobo: data?.payment?.amountKobo,
        reference: data?.payment?.reference,
        metadata: {
          custom_fields: [
            { display_name: 'Pin Credits', variable_name: 'units', value: String(parsedUnits) },
          ],
        },
      })
      await pinsAPI.verifyCredits({
        purchaseId: data?.purchase?._id,
        reference: data?.payment?.reference,
      })
      toast.success(`${parsedUnits} pin credit(s) added`)
      await loadDashboardData()
    } catch (err) {
      if (err?.message === 'Payment window closed') toast('Payment window closed')
      else toast.error(err?.error || err?.message || 'Could not purchase credits')
    } finally {
      setPinActionId(null)
    }
  }

  const activeListings = listings.filter(l => l.status === 'active')
  const expiredListings = listings.filter(l => l.status === 'expired')
  const totalViews = listings.reduce((acc, l) => acc + (l.views || 0), 0)
  const revenueOverview = activeListings.reduce((acc, l) => acc + (l.price || 0), 0)
  const subscriptionStatus = user?.subscription?.plan
    ? `${String(user.subscription.plan).replace('_', ' ')}`
    : 'No active seller plan'

  const analytics = [
    { label: 'Active Listings', value: activeListings.length, icon: 'fa-solid fa-store', color: 'var(--nw-primary)' },
    { label: 'Expired Listings', value: expiredListings.length, icon: 'fa-solid fa-clock-rotate-left', color: 'var(--nw-accent)' },
    { label: 'Pin Credits', value: pinUsage?.credits?.balance || 0, icon: 'fa-solid fa-coins', color: 'var(--nw-gold)' },
    { label: 'Pins in Use', value: pinUsage.activeCount || 0, icon: 'fa-solid fa-thumbtack', color: 'var(--nw-gold)' },
    { label: 'Pin Hours Left', value: pinUsage.activeHoursRemaining || 0, icon: 'fa-solid fa-hourglass-half', color: 'var(--nw-accent)' },
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
            <div className="action-wrap">
              <button className="btn btn-primary" onClick={() => navigate('/marketplace?create=true')}>
                + New Listing
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/marketplace?mine=true')}>
                Manage Listings
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/profile/subscription')}>
                Pin Management
              </button>
              <button className="btn btn-secondary" onClick={() => { setPinPickerType('listing'); setShowPinPicker(true) }}>
                Pin Post
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/profile/subscription')}>
                Subscription Status
              </button>
            </div>
          </div>

          <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 'var(--space-3)' }}>Pin Status</h2>
            <div className="action-wrap" style={{ marginBottom: 12, alignItems: 'center', gap: 8 }}>
              <span className="badge badge-primary">Credits: {pinUsage?.credits?.balance || 0}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => buyCredits(1)} disabled={Boolean(pinActionId)}>
                {pinActionId === 'buy-1' ? 'Processing...' : 'Buy 1 Credit (₦500)'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => buyCredits(5)} disabled={Boolean(pinActionId)}>
                {pinActionId === 'buy-5' ? 'Processing...' : 'Buy 5 Credits (₦2,500)'}
              </button>
            </div>
            {activePins.length === 0 ? (
              <div className="caption">No active pins right now.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {activePins.map((pin) => (
                  <div key={pin._id} style={{ border: '1px solid var(--nw-gray-200)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {pin.targetPreview?.image ? (
                        <img
                          src={pin.targetPreview.image}
                          alt={pin.targetPreview?.title || 'Pinned content'}
                          style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--nw-gray-200)' }}
                        />
                      ) : pin.targetType === 'lostfound' ? (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--nw-gray-200)',
                            background: 'var(--nw-gray-100)',
                            color: 'var(--nw-gray-500)',
                          }}
                        >
                          <i className={lostFoundCategoryIcon(pin.targetPreview?.category)} aria-hidden="true" />
                        </div>
                      ) : null}
                      <div style={{ fontWeight: 600 }}>
                        {String(pin.targetType || '').toUpperCase()} · {pin.targetPreview?.title || pin.targetId}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div className="caption">{formatPinTimeLeft(pin.expiresAt)}</div>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => extendPin(pin)} disabled={Boolean(pinActionId)}>
                        {pinActionId === `extend-${pin._id}` ? 'Extending...' : 'Extend +24h'}
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => unpin(pin)} disabled={Boolean(pinActionId)}>
                        {pinActionId === `unpin-${pin._id}` ? 'Unpinning...' : 'Unpin'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div className="section-header-row" style={{ marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>My Posts</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/social')}>Open Social</button>
            </div>

            {loading ? (
              <div className="grid-3">
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-xl)' }} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__title">No posts yet.</div>
              </div>
            ) : (
              <div className="grid-3">
                {posts.slice(0, 6).map((post) => {
                  const isPinned = Boolean(post.pin && new Date(post.pin.expiresAt).getTime() > Date.now())
                  return (
                    <div key={post._id} className={`card card-body ${isPinned ? 'pinned-card' : ''}`}>
                      {isPinned && (
                        <div style={{ marginBottom: 6 }}>
                          <span className="pin-badge" style={{ position: 'static' }}>
                            <i className="fa-solid fa-thumbtack" aria-hidden="true" /> Pinned · {formatPinTimeLeft(post.pin?.expiresAt)}
                          </span>
                        </div>
                      )}
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>
                        {String(post.content || '').slice(0, 92) || 'Photo post'}
                      </div>
                      <div className="caption" style={{ marginBottom: 10 }}>
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} · {post.likeCount || 0} likes
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => togglePostPin(post)} disabled={Boolean(pinActionId)}>
                          {pinActionId === `post-${post._id}` ? 'Processing...' : isPinned ? 'Unpin Post' : 'Pin Post'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={showPinPicker}
        onClose={() => setShowPinPicker(false)}
        title="Pin Content"
        size="lg"
      >
        <div className="action-wrap" style={{ gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            className={`btn btn-sm ${pinPickerType === 'listing' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setPinPickerType('listing')}
          >
            Products
          </button>
          <button
            type="button"
            className={`btn btn-sm ${pinPickerType === 'post' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setPinPickerType('post')}
          >
            Posts
          </button>
        </div>

        {pinPickerType === 'listing' ? (
          activeListings.length === 0 ? (
            <div className="caption">No active products to pin.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {activeListings.slice(0, 20).map((item) => {
                const isPinned = Boolean(item.pin && new Date(item.pin.expiresAt).getTime() > Date.now())
                return (
                  <div key={item._id} style={{ border: '1px solid var(--nw-gray-200)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--nw-gray-100)', border: '1px solid var(--nw-gray-200)', flexShrink: 0 }}>
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nw-gray-400)' }}>
                            <i className="fa-solid fa-image" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        <div className="caption">₦{(item.price || 0).toLocaleString()} {isPinned ? `· ${formatPinTimeLeft(item.pin?.expiresAt)}` : ''}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleListingPin(item)}
                      disabled={Boolean(pinActionId)}
                    >
                      {pinActionId === `listing-${item._id}` ? 'Processing...' : isPinned ? 'Unpin' : 'Pin Product'}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          posts.length === 0 ? (
            <div className="caption">No posts to pin.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {posts.slice(0, 20).map((post) => {
                const isPinned = Boolean(post.pin && new Date(post.pin.expiresAt).getTime() > Date.now())
                return (
                  <div key={post._id} style={{ border: '1px solid var(--nw-gray-200)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{String(post.content || '').slice(0, 90) || 'Photo post'}</div>
                      <div className="caption">{isPinned ? formatPinTimeLeft(post.pin?.expiresAt) : 'Not pinned'}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => togglePostPin(post)}
                      disabled={Boolean(pinActionId)}
                    >
                      {pinActionId === `post-${post._id}` ? 'Processing...' : isPinned ? 'Unpin' : 'Pin Post'}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        )}
      </Modal>
    </div>
  )
}

function Section({ title, loading, items, emptyText, onViewAll }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div className="section-header-row" style={{ marginBottom: 'var(--space-4)' }}>
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
