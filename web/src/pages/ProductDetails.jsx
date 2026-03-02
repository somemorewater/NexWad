import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { chatAPI, listingsAPI } from '../api/endpoints'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { resetSocialMeta, setSocialMeta, shareLink } from '../utils/socialMeta'
import { useAuth } from '../hooks/useAuth'

export default function ProductDetails() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [listing, setListing] = useState(null)
  const [activeImage, setActiveImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [startingChat, setStartingChat] = useState(false)

  useEffect(() => {
    if (!listingId) return
    setLoading(true)
    listingsAPI.getById(listingId)
      .then(({ data }) => {
        setListing(data.listing)
        setActiveImage(data.listing?.images?.[0] || '')
      })
      .catch(() => toast.error('Could not load listing details'))
      .finally(() => setLoading(false))
  }, [listingId])

  useEffect(() => {
    if (!listing) return
    setSocialMeta({
      title: `${listing.title} - NexWAD Marketplace`,
      description: listing.description || `Check out ${listing.title} on NexWAD.`,
      image: listing.images?.[0] || '/nexwad-social.png',
      url: `/marketplace/${listing._id}`,
      type: 'product',
    })
    return () => resetSocialMeta()
  }, [listing])

  const messageSeller = async () => {
    if (!isAuthenticated) {
      toast.error('Login required to message seller')
      return
    }
    const sellerId = listing?.seller?._id || listing?.seller
    if (!listing?._id || !sellerId) {
      toast.error('Seller details unavailable for this listing')
      return
    }
    setStartingChat(true)
    try {
      const { data } = await chatAPI.getOrCreate(listing._id, sellerId)
      navigate(`/chat/${data.chat._id}`)
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not open chat')
    } finally {
      setStartingChat(false)
    }
  }

  const shareProduct = async () => {
    if (!listing) return
    try {
      const mode = await shareLink({
        title: listing.title,
        text: `${listing.title} - N${listing.price?.toLocaleString?.() || listing.price} on NexWAD`,
        url: `/marketplace/${listing._id}`,
      })
      if (mode === 'copied') toast.success('Link copied')
      if (mode === 'unsupported') toast.error('Sharing not supported on this device')
    } catch {
      toast.error('Could not share product')
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          {loading ? (
            <div className="card card-body">Loading product details...</div>
          ) : !listing ? (
            <div className="empty-state">
              <div className="empty-state__icon" style={{ fontSize: '2rem' }}><i className="fa-solid fa-box-open" aria-hidden="true" /></div>
              <div className="empty-state__title">Listing not found</div>
              <button className="btn btn-primary" onClick={() => navigate('/marketplace')}>
                Back to Marketplace
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 'var(--space-6)' }}>
              <section className="card card-body">
                <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--nw-gray-100)', marginBottom: 'var(--space-4)' }}>
                  <img
                    src={activeImage || listing.images?.[0] || '/placeholder.jpg'}
                    alt={listing.title}
                    style={{ width: '100%', maxHeight: 460, objectFit: 'cover' }}
                  />
                </div>
                {listing.images?.length > 1 && (
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                    {listing.images.map((img) => (
                      <button
                        key={img}
                        onClick={() => setActiveImage(img)}
                        style={{
                          border: img === activeImage ? '2px solid var(--nw-primary)' : '1px solid var(--nw-gray-200)',
                          borderRadius: 10,
                          padding: 0,
                          background: 'transparent',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          width: 88,
                          height: 88,
                          flexShrink: 0,
                        }}
                      >
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <aside className="card card-body">
                <div className="listing-card__category">{listing.category}</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', lineHeight: 1.2, marginBottom: 8 }}>
                  {listing.title}
                </h1>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', marginBottom: 'var(--space-3)' }}>
                  N{listing.price?.toLocaleString()}
                </div>
                <div style={{ color: 'var(--nw-gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                  Posted {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                </div>

                <div style={{ marginBottom: 'var(--space-5)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Description</div>
                  <p style={{ color: 'var(--nw-gray-600)', lineHeight: 1.65 }}>
                    {listing.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{ display: 'grid', gap: 10, marginBottom: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--nw-gray-500)' }}>Condition</span>
                    <strong>{listing.condition || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--nw-gray-500)' }}>Views</span>
                    <strong>{listing.views || 0}</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--nw-gray-100)', paddingTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <button
                    type="button"
                    onClick={() => listing.seller?._id && navigate(`/profile/${listing.seller._id}`)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      cursor: listing.seller?._id ? 'pointer' : 'default',
                      fontWeight: 600,
                      color: 'var(--nw-ink)',
                    }}
                  >
                    {listing.seller?.name}
                  </button>
                  <div className="caption">{listing.seller?.department || 'Seller'}</div>
                </div>

                <button className="btn btn-primary" onClick={messageSeller} disabled={startingChat}>
                  {startingChat ? 'Opening chat...' : 'Get Product'}
                </button>
                <button className="btn btn-secondary" onClick={shareProduct} style={{ marginTop: 10 }}>
                  Share Product
                </button>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
