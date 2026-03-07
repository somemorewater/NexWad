import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import { chatAPI, listingsAPI } from '../api/endpoints'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { resetSocialMeta, setSocialMeta, shareLink } from '../utils/socialMeta'
import { useAuth } from '../hooks/useAuth'
import { getUserPath } from '../utils/userPath'
import ReportActionMenu from '../components/ReportActionMenu'

export default function ProductDetails() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [listing, setListing] = useState(null)
  const [activeImage, setActiveImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [startingChat, setStartingChat] = useState(false)
  const [updatingListing, setUpdatingListing] = useState(false)
  const [deletingListing, setDeletingListing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', price: '', description: '' })
  const [editExistingImages, setEditExistingImages] = useState([])
  const [editNewImages, setEditNewImages] = useState([])
  const MAX_LISTING_IMAGES = 4

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

  const reportProduct = async (reason) => {
    if (!listing?._id) return
    if (!isAuthenticated) throw new Error('Login required to report products')
    await listingsAPI.report(listing._id, reason)
  }

  const isOwner = Boolean(user?._id && listing?.seller?._id && user._id === listing.seller._id)

  const openEditModal = () => {
    if (!listing || !isOwner) return
    setEditForm({
      title: listing.title || '',
      price: String(listing.price ?? ''),
      description: listing.description || '',
    })
    setEditExistingImages(
      (listing.images || []).map((url, index) => ({
        url,
        publicId: listing.imagePublicIds?.[index] || '',
        keep: true,
      }))
    )
    setEditNewImages([])
    setShowEditModal(true)
  }

  const handleEditImages = (event) => {
    const incoming = Array.from(event.target.files || [])
    if (!incoming.length) return
    const keptCount = editExistingImages.filter((img) => img.keep).length
    const available = MAX_LISTING_IMAGES - keptCount - editNewImages.length
    if (available <= 0) {
      toast.error(`Maximum ${MAX_LISTING_IMAGES} images allowed`)
      event.target.value = ''
      return
    }
    const nextFiles = incoming.slice(0, available)
    if (incoming.length > available) toast.error(`Only ${available} more image(s) can be added`)
    setEditNewImages((prev) => [...prev, ...nextFiles])
    event.target.value = ''
  }

  const submitEditListing = async () => {
    if (!listing?._id || !isOwner || updatingListing) return
    const nextTitle = String(editForm.title || '').trim()
    const nextDescription = String(editForm.description || '').trim()
    const nextPrice = Number(editForm.price)
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      toast.error('Price must be a valid non-negative number')
      return
    }
    if (!nextTitle) {
      toast.error('Title is required')
      return
    }

    setUpdatingListing(true)
    try {
      const payload = new FormData()
      payload.append('title', nextTitle)
      payload.append('price', String(nextPrice))
      payload.append('description', nextDescription)
      editExistingImages.filter((img) => img.keep).forEach((img) => {
        if (img.publicId) payload.append('retainImagePublicIds', img.publicId)
        else if (img.url) payload.append('retainImageUrls', img.url)
      })
      editNewImages.forEach((file) => payload.append('images', file))
      const { data } = await listingsAPI.update(listing._id, payload)
      setListing((prev) => ({ ...prev, ...data.listing }))
      if (data?.listing?.images?.length) setActiveImage(data.listing.images[0])
      setShowEditModal(false)
      toast.success('Listing updated')
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not update listing')
    } finally {
      setUpdatingListing(false)
    }
  }

  const deleteListing = async () => {
    if (!listing?._id || !isOwner || deletingListing) return
    if (!window.confirm('Delete this listing?')) return

    setDeletingListing(true)
    try {
      await listingsAPI.delete(listing._id)
      toast.success('Listing deleted')
      navigate('/marketplace?mine=true')
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not delete listing')
    } finally {
      setDeletingListing(false)
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
            <div className="product-details-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 'var(--space-6)' }}>
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
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', lineHeight: 1.2, marginBottom: 0 }}>
                    {listing.title}
                  </h1>
                  {!isOwner && (
                    <ReportActionMenu
                      onReport={reportProduct}
                      entityLabel="product"
                      buttonClassName="post-card__menu-btn"
                    />
                  )}
                </div>
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
                    onClick={() => listing.seller?._id && navigate(getUserPath(listing.seller))}
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

                {isOwner ? (
                  <>
                    <button className="btn btn-primary" onClick={openEditModal} disabled={updatingListing}>
                      {updatingListing ? 'Updating...' : 'Edit Listing'}
                    </button>
                    <button className="btn btn-danger" onClick={deleteListing} disabled={deletingListing} style={{ marginTop: 10 }}>
                      {deletingListing ? 'Deleting...' : 'Delete Listing'}
                    </button>
                  </>
                ) : (
                  <button className="btn btn-primary" onClick={messageSeller} disabled={startingChat}>
                    {startingChat ? 'Opening chat...' : 'Get Product'}
                  </button>
                )}
                <button className="btn btn-secondary" onClick={shareProduct} style={{ marginTop: 10 }}>
                  Share Product
                </button>
              </aside>
            </div>
          )}
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Listing"
            footer={(
              <>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={updatingListing}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={submitEditListing} disabled={updatingListing}>
                  {updatingListing ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Price (₦)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.price}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Images (max {MAX_LISTING_IMAGES})</label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {editExistingImages.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {editExistingImages.map((img, index) => (
                        <div key={`${img.url}-${index}`} style={{ position: 'relative' }}>
                          <img src={img.url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, opacity: img.keep ? 1 : 0.35 }} />
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditExistingImages((prev) => prev.map((item, idx) => (idx === index ? { ...item, keep: !item.keep } : item)))}
                            style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(255,255,255,0.9)' }}
                          >
                            {img.keep ? 'Remove' : 'Undo'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {editNewImages.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {editNewImages.map((file, index) => (
                        <div key={`${file.name}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span>{file.name}</span>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditNewImages((prev) => prev.filter((_, idx) => idx !== index))}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input type="file" accept="image/*" multiple onChange={handleEditImages} />
                </div>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}
