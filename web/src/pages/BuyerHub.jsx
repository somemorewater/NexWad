import { useEffect, useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import { listingsAPI, postsAPI, lostFoundAPI, pinsAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import { SocketContext } from '../context/SocketContext'
import { isPremiumBuyer } from '../utils/roleRouting'
import { formatPinTimeLeft, runPaystackCharge } from '../utils/pins'
import toast from 'react-hot-toast'

export default function BuyerHub() {
  const { user } = useAuth()
  const { unreadCount } = useContext(SocketContext)
  const navigate = useNavigate()
  const [preview, setPreview] = useState({ listings: [], posts: [], items: [] })
  const [pinUsage, setPinUsage] = useState({ credits: { balance: 0 } })
  const [pinActionId, setPinActionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPinnedListing, setSelectedPinnedListing] = useState(null)
  const premium = isPremiumBuyer(user)
  const isSeller = String(user?.role || '').toLowerCase() === 'seller'

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

  useEffect(() => {
    if (!isSeller) return
    pinsAPI.getMine()
      .then(({ data }) => {
        setPinUsage(data?.usage || { credits: { balance: 0 } })
      })
      .catch(() => {})
  }, [isSeller])

  const pinnedHighlights = preview.listings.filter((item) => item.isPinned)

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
      const verifyRes = await pinsAPI.verifyCredits({
        purchaseId: data?.purchase?._id,
        reference: data?.payment?.reference,
      })
      setPinUsage((prev) => ({
        ...prev,
        credits: {
          ...(prev?.credits || {}),
          ...(verifyRes?.data?.credits || {}),
        },
      }))
      toast.success(`${parsedUnits} pin credit(s) added`)
    } catch (err) {
      if (err?.message === 'Payment window closed') toast('Payment window closed')
      else toast.error(err?.error || err?.message || 'Could not purchase credits')
    } finally {
      setPinActionId(null)
    }
  }

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

          {pinnedHighlights.length > 0 && (
            <section className="pin-strip" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="pin-strip__header">
                <h2 className="pin-strip__title"><i className="fa-solid fa-thumbtack" aria-hidden="true" /> Pinned Now</h2>
              </div>
              <div className="pin-strip__scroller">
                {pinnedHighlights.map((item) => (
                  <button
                    key={`pin-${item._id}`}
                    type="button"
                    className="pin-strip__item"
                    style={{ cursor: 'pointer', textAlign: 'left' }}
                    onClick={() => setSelectedPinnedListing(item)}
                  >
                    <div className="pin-strip__thumb">
                      {item.images?.[0]
                        ? <img src={item.images[0]} alt={item.title} />
                        : <i className="fa-solid fa-image" aria-hidden="true" />}
                    </div>
                    <div className="pin-strip__content">
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                      <div className="caption">Listing · {formatPinTimeLeft(item.pin?.expiresAt)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

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

          {isSeller && (
            <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 'var(--space-2)' }}>Pin Credits</h2>
              <p style={{ color: 'var(--nw-gray-500)', marginBottom: 'var(--space-4)' }}>
                Buy pinning credits to pin your own listings for extra visibility.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                <span className="badge badge-primary">Credits: {pinUsage?.credits?.balance || 0}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => buyCredits(1)} disabled={Boolean(pinActionId)}>
                  {pinActionId === 'buy-1' ? 'Processing...' : 'Buy 1 Credit (₦500)'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => buyCredits(5)} disabled={Boolean(pinActionId)}>
                  {pinActionId === 'buy-5' ? 'Processing...' : 'Buy 5 Credits (₦2,500)'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => buyCredits(10)} disabled={Boolean(pinActionId)}>
                  {pinActionId === 'buy-10' ? 'Processing...' : 'Buy 10 Credits (₦5,000)'}
                </button>
              </div>
              <div className="caption">Tip: Tap Pin on your own listing card to spend credits.</div>
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

      <Modal
        isOpen={Boolean(selectedPinnedListing)}
        onClose={() => setSelectedPinnedListing(null)}
        title={selectedPinnedListing?.title || 'Product Details'}
        size="md"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setSelectedPinnedListing(null)}>
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (selectedPinnedListing?._id) navigate(`/marketplace/${selectedPinnedListing._id}`)
                setSelectedPinnedListing(null)
              }}
            >
              Open Listing
            </button>
          </>
        )}
      >
        {selectedPinnedListing && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ width: '100%', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--nw-gray-200)', background: 'var(--nw-gray-100)' }}>
              {selectedPinnedListing.images?.[0] ? (
                <img
                  src={selectedPinnedListing.images[0]}
                  alt={selectedPinnedListing.title}
                  style={{ width: '100%', maxHeight: 260, objectFit: 'cover' }}
                />
              ) : (
                <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nw-gray-400)' }}>
                  <i className="fa-solid fa-image" aria-hidden="true" />
                </div>
              )}
            </div>

            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>₦{(selectedPinnedListing.price || 0).toLocaleString()}</div>
            <div className="caption">Seller: {selectedPinnedListing.seller?.name || 'Seller'}</div>
            {selectedPinnedListing.description && (
              <p style={{ margin: 0, color: 'var(--nw-gray-700)', lineHeight: 1.6 }}>{selectedPinnedListing.description}</p>
            )}
          </div>
        )}
      </Modal>
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
  const previewItems = Array.isArray(items) ? items.slice(0, 3) : []
  return (
    <div className="card card-body">
      <div className="section-header-row" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{title}</h2>
        <Link to={linkTo} className="btn btn-ghost btn-sm">View all</Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2, 3].map(n => <div key={n} className="skeleton" style={{ height: 62, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : previewItems.length === 0 ? (
        <p style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem' }}>{emptyText}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {previewItems.map(renderItem)}
        </div>
      )}
    </div>
  )
}
