import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { ListingCard } from '../components/Card'
import Modal from '../components/Modal'
import { chatAPI, listingsAPI } from '../api/endpoints'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { formatPinTimeLeft } from '../utils/pins'
import imageCompression from 'browser-image-compression'
import { LISTING_CATEGORIES, MARKETPLACE_FILTER_CATEGORIES } from '../constants/categories'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
]
const MAX_LISTING_IMAGES = 4
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1280,
  // Sequential compression is more stable on low-memory mobile devices.
  useWebWorker: false,
}
const MAX_UPLOAD_RETRIES = 2
const TOTAL_UPLOAD_ATTEMPTS = MAX_UPLOAD_RETRIES + 1
const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

function isSupportedImageFile(file) {
  const mime = String(file?.type || '').toLowerCase()
  if (mime && SUPPORTED_IMAGE_MIME_TYPES.has(mime)) return true
  const name = String(file?.name || '')
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  return SUPPORTED_IMAGE_EXTENSIONS.has(ext)
}

export default function Marketplace() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [listings, setListings] = useState([])
  const [pinnedListings, setPinnedListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('newest')
  const [selectedPinnedListing, setSelectedPinnedListing] = useState(null)
  const [openingChat, setOpeningChat] = useState(false)
  const canSell = user?.role === 'seller'
  const [showCreate, setShowCreate] = useState(searchParams.get('create') === 'true' && canSell)

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreate(canSell)
    }
  }, [canSell, searchParams])

  useEffect(() => {
    if (!canSell && showCreate) setShowCreate(false)
  }, [canSell, showCreate])

  const fetchListings = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const { data } = await listingsAPI.getAll({
        page: reset ? 1 : page,
        limit: 12,
        category: category === 'All' ? undefined : category,
        sort,
        q: searchParams.get('q') || undefined,
        mine: searchParams.get('mine') || undefined,
        saved: searchParams.get('saved') || undefined,
      })
      if (reset) {
        setListings(data.listings)
        setPage(2)
      } else {
        setListings(prev => [...prev, ...data.listings])
        setPage(p => p + 1)
      }
      setHasMore(data.hasMore)
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [category, sort, searchParams, page])

  useEffect(() => {
    fetchListings(true)
  }, [category, sort, searchParams.get('q'), searchParams.get('mine'), searchParams.get('saved')])

  useEffect(() => {
    const isMine = searchParams.get('mine')
    const isSaved = searchParams.get('saved')
    const hasQuery = searchParams.get('q')
    if (isMine || isSaved || hasQuery) {
      setPinnedListings([])
      return
    }
    listingsAPI.getPinned({
      limit: 8,
      category: category === 'All' ? undefined : category,
    })
      .then(({ data }) => setPinnedListings(data?.listings || []))
      .catch(() => setPinnedListings([]))
  }, [category, searchParams.get('mine'), searchParams.get('saved'), searchParams.get('q')])

  const title = searchParams.get('mine') ? 'My Listings'
    : searchParams.get('saved') ? 'Saved Items'
    : 'Marketplace'

  const displayListings = useMemo(() => {
    if (!pinnedListings.length) return listings
    const seen = new Set()
    const merged = [...pinnedListings, ...listings].filter((item) => {
      const key = String(item?._id || '')
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    return merged
  }, [listings, pinnedListings])

  const handlePinnedListingClick = (item) => {
    setSelectedPinnedListing(item)
  }

  const handleGetProduct = async () => {
    const sellerId = selectedPinnedListing?.seller?._id || selectedPinnedListing?.seller
    if (!selectedPinnedListing?._id || !sellerId) {
      toast.error('Seller details unavailable for this listing')
      return
    }
    if (!isAuthenticated) {
      toast.error('Login required to message seller')
      navigate('/login')
      return
    }

    setOpeningChat(true)
    try {
      const { data } = await chatAPI.getOrCreate(selectedPinnedListing._id, sellerId)
      setSelectedPinnedListing(null)
      navigate(`/chat/${data.chat._id}`)
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not open chat')
    } finally {
      setOpeningChat(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header-row" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="page-header" style={{ marginBottom: 0 }}>
              <h1 className="page-header__title">{title}</h1>
              <p className="page-header__sub">{displayListings.length} items found</p>
            </div>
            {!searchParams.get('saved') && canSell && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                + New Listing
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="filter-bar">
            {MARKETPLACE_FILTER_CATEGORIES.map(c => (
              <button
                key={c}
                className={`filter-chip ${category === c ? 'active' : ''}`}
                onClick={() => { setCategory(c) }}
              >
                {c}
              </button>
            ))}
            <select
              className="form-select marketplace-sort"
              style={{ width: 'auto', padding: '7px 14px', borderRadius: 'var(--radius-full)', marginLeft: 'auto' }}
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {!isAuthenticated && (
            <div className="card card-body" style={{ marginBottom: 'var(--space-5)', color: 'var(--nw-gray-600)' }}>
              You are browsing as a guest. Login to save items, chat with sellers, or create listings.
            </div>
          )}

          {pinnedListings.length > 0 && (
            <section className="pin-strip" style={{ marginBottom: 'var(--space-5)' }}>
              <div className="pin-strip__header">
                <h2 className="pin-strip__title"><i className="fa-solid fa-thumbtack" aria-hidden="true" /> Pinned Listings</h2>
              </div>
              <div className="pin-strip__scroller">
                {pinnedListings.map((item) => (
                  <button
                    key={`pin-${item._id}`}
                    type="button"
                    className="pin-strip__item"
                    style={{ cursor: 'pointer', textAlign: 'left' }}
                    onClick={() => handlePinnedListingClick(item)}
                  >
                    <div className="pin-strip__thumb">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.title} />
                      ) : (
                        <i className="fa-solid fa-image" aria-hidden="true" />
                      )}
                    </div>
                    <div className="pin-strip__content">
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                      <div className="caption">₦{(item.price || 0).toLocaleString()} · {formatPinTimeLeft(item.pin?.expiresAt)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Grid */}
          {loading && displayListings.length === 0 ? (
            <div className="grid-3">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-xl)' }} />
              ))}
            </div>
          ) : displayListings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon" style={{ fontSize: '2rem' }}><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /></div>
              <div className="empty-state__title">No listings found</div>
              <div className="empty-state__text">Try a different category or be the first to sell!</div>
              {canSell && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Listing</button>}
            </div>
          ) : (
            <>
              <div className="grid-3">
                {displayListings.map((l, i) => (
                  <div key={l._id} className="animate-fade-in" style={{ animationDelay: `${(i % 12) * 0.04}s` }}>
                    <ListingCard
                      listing={l}
                      showGetProduct
                      onUpdated={(updated) => {
                        setListings((prev) => prev.map((entry) => (entry._id === updated._id ? { ...entry, ...updated } : entry)))
                        setPinnedListings((prev) => prev.map((entry) => (entry._id === updated._id ? { ...entry, ...updated } : entry)))
                      }}
                      onDeleted={(listingId) => {
                        setListings((prev) => prev.filter((entry) => entry._id !== listingId))
                        setPinnedListings((prev) => prev.filter((entry) => entry._id !== listingId))
                      }}
                    />
                  </div>
                ))}
              </div>
              {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-8)' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => fetchListings(false)}
                    disabled={loading}
                  >
                    {loading ? <span className="spinner" /> : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Create Listing Modal */}
      {canSell && <CreateListingModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={(l) => setListings(prev => [l, ...prev])} />}

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
            {(() => {
              const sellerId = selectedPinnedListing?.seller?._id || selectedPinnedListing?.seller
              const isOwner = Boolean(user?._id && sellerId && String(user._id) === String(sellerId))
              if (isOwner) {
                return (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      if (selectedPinnedListing?._id) navigate(`/marketplace/${selectedPinnedListing._id}`)
                      setSelectedPinnedListing(null)
                    }}
                  >
                    Open Listing
                  </button>
                )
              }
              return (
                <button className="btn btn-primary" onClick={handleGetProduct} disabled={openingChat}>
                  {openingChat ? 'Opening chat...' : 'Get Product'}
                </button>
              )
            })()}
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

function CreateListingModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', price: '', originalPrice: '',
    category: '', condition: 'good', images: [],
  })
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadAttempt, setUploadAttempt] = useState(0)
  const [imagePreviews, setImagePreviews] = useState([])

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }))

  useEffect(() => () => {
    imagePreviews.forEach((src) => URL.revokeObjectURL(src))
  }, [imagePreviews])

  const handleImages = async (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    if (selectedFiles.length > MAX_LISTING_IMAGES) {
      toast.error(`You can upload up to ${MAX_LISTING_IMAGES} images per listing`)
    }
    const files = selectedFiles.slice(0, MAX_LISTING_IMAGES)

    const invalidType = files.find((file) => !isSupportedImageFile(file))
    if (invalidType) {
      toast.error(`"${invalidType.name}" is not supported. Use JPG, PNG, WEBP, or GIF`)
      return
    }

    const tooLarge = files.find((file) => file.size > MAX_IMAGE_SIZE_BYTES)
    if (tooLarge) {
      toast.error(`"${tooLarge.name}" is too large. Max size is 4MB per image`)
      return
    }

    setCompressing(true)
    try {
      const processedFiles = []
      let compressionFailures = 0

      for (const file of files) {
        try {
          const compressed = await imageCompression(file, COMPRESSION_OPTIONS)
          processedFiles.push(compressed)
        } catch (err) {
          compressionFailures += 1
          // Fallback to original file so multi-image selection does not fail as a whole.
          processedFiles.push(file)
          console.warn('Image compression failed for file:', file?.name, err?.message || err)
        }
      }

      if (compressionFailures > 0) {
        toast.error(`${compressionFailures} image(s) could not be compressed. Uploading original for those files.`)
      }

      setForm((prev) => ({ ...prev, images: processedFiles }))
      setImagePreviews(processedFiles.map((file) => URL.createObjectURL(file)))
    } catch (err) {
      toast.error(err?.message || 'Image compression failed')
    } finally {
      setCompressing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.price || !form.category) {
      toast.error('Fill in all required fields')
      return
    }
    if (!form.images?.length) {
      toast.error('Add at least one image before publishing')
      return
    }

    setLoading(true)
    setUploadProgress(0)
    try {
      let data
      for (let attempt = 0; attempt <= MAX_UPLOAD_RETRIES; attempt += 1) {
        setUploadAttempt(attempt + 1)
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => {
          if (k === 'images') v.forEach((img) => fd.append('images', img))
          else fd.append(k, v)
        })
        try {
          const res = await listingsAPI.create(fd, {
            timeout: 120000,
            onUploadProgress: (progressEvent) => {
              if (!progressEvent?.total) return
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(percent)
            },
          })
          data = res.data
          break
        } catch (err) {
          if (attempt < MAX_UPLOAD_RETRIES) {
            toast.error(`Upload failed. Retrying (${attempt + 1}/${MAX_UPLOAD_RETRIES})...`)
            continue
          }
          throw err
        }
      }

      toast.success('Listing created!')
      onCreated?.(data.listing)
      onClose()
      setForm({ title: '', description: '', price: '', originalPrice: '', category: '', condition: 'good', images: [] })
      setImagePreviews([])
      setUploadProgress(0)
      setUploadAttempt(0)
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Listing" size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || compressing}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : compressing ? 'Compressing...' : 'Publish Listing'}
          </button>
        </>
      }
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Image upload */}
        <div className="form-group">
          <label className="form-label">Photos (up to 4)</label>
          <label className="upload-area" htmlFor="listing-images" style={{ cursor: 'pointer' }}>
            {imagePreviews.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {imagePreviews.map((src, i) => (
                  <img key={i} src={src} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                ))}
                <div style={{ width: 80, height: 80, border: '2px dashed var(--nw-gray-300)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nw-gray-400)', fontSize: '1.5rem' }}>+</div>
              </div>
            ) : (
              <>
                <div className="upload-area__icon"><i className="fa-solid fa-camera" aria-hidden="true" /></div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Drop photos here or click to browse</div>
                <div className="caption">PNG, JPG, WEBP up to 4MB each. Files are compressed before upload.</div>
              </>
            )}
            <input id="listing-images" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={handleImages} />
          </label>
          {(compressing || loading) && (
            <div className="caption" style={{ marginTop: 8 }}>
              {compressing
                ? 'Compressing images...'
                : `Uploading... ${uploadProgress}%${uploadAttempt ? ` (attempt ${uploadAttempt}/${TOTAL_UPLOAD_ATTEMPTS})` : ''}`}
            </div>
          )}
          {!compressing && loading && (
            <div style={{ marginTop: 8, height: 8, background: 'var(--nw-gray-200)', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'var(--nw-primary)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Title *</label>
          <input type="text" className="form-input" placeholder="e.g. Scientific Calculator" value={form.title} onChange={set('title')} />
        </div>

        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Price (₦) *</label>
            <input type="number" className="form-input" placeholder="6000" value={form.price} onChange={set('price')} />
          </div>
          <div className="form-group">
            <label className="form-label">Original Price (₦)</label>
            <input type="number" className="form-input" placeholder="Optional" value={form.originalPrice} onChange={set('originalPrice')} />
          </div>
        </div>

        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={form.category} onChange={set('category')}>
              <option value="">Select category</option>
              {LISTING_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Condition</label>
            <select className="form-select" value={form.condition} onChange={set('condition')}>
              <option value="new">Brand New</option>
              <option value="excellent">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" placeholder="Describe your item clearly..." value={form.description} onChange={set('description')} rows={3} />
        </div>
      </form>
    </Modal>
  )
}
