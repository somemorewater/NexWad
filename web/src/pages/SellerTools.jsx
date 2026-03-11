import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { listingsAPI, usersAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import { shareLink } from '../utils/socialMeta'
import { getUserPath } from '../utils/userPath'

export default function SellerTools() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const POSTER_FEATURE_ENABLED = false
  const [listings, setListings] = useState([])
  const [selectedProducts, setSelectedProducts] = useState(
    (user?.featuredProducts || []).map((id) => String(id))
  )
  const [posterUrl, setPosterUrl] = useState('')
  const [loadingListings, setLoadingListings] = useState(true)
  const [savingFeatured, setSavingFeatured] = useState(false)
  const [posterLoading, setPosterLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoadingListings(true)
      try {
        const requests = [listingsAPI.getMyListings()]
        if (POSTER_FEATURE_ENABLED) {
          requests.push(user?.username ? usersAPI.getPoster(user.username) : usersAPI.getPoster(user?._id))
        }
        const [listingsRes, posterRes] = await Promise.allSettled(requests)
        if (!mounted) return
        if (listingsRes.status === 'fulfilled') {
          setListings(listingsRes.value?.data?.listings || [])
        }
        if (POSTER_FEATURE_ENABLED && posterRes?.status === 'fulfilled') {
          setPosterUrl(posterRes.value?.data?.posterImageUrl || '')
        }
      } catch {
        if (mounted) toast.error('Failed to load seller tools')
      } finally {
        if (mounted) setLoadingListings(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user?._id, user?.username])

  const activeListings = useMemo(
    () => (listings || []).filter((item) => item.status === 'active'),
    [listings]
  )

  const toggleFeatured = (listingId) => {
    const id = String(listingId)
    setSelectedProducts((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) {
        toast.error('You can feature up to 3 products')
        return prev
      }
      return [...prev, id]
    })
  }

  const saveFeaturedProducts = async () => {
    setSavingFeatured(true)
    try {
      const { data } = await usersAPI.setFeaturedProducts(selectedProducts)
      updateUser(data.user)
      toast.success('Featured products updated')
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not save featured products')
    } finally {
      setSavingFeatured(false)
    }
  }

  const generatePoster = async () => {
    setPosterLoading(true)
    try {
      const { data } = await usersAPI.generatePoster()
      if (data?.posterImageUrl) setPosterUrl(data.posterImageUrl)
      toast.success('Brand poster generated')
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not generate poster')
    } finally {
      setPosterLoading(false)
    }
  }

  const deletePoster = async () => {
    if (!posterUrl) {
      toast.error('No poster to delete')
      return
    }
    if (!window.confirm('Delete current brand poster? You can generate a new one anytime.')) return

    setPosterLoading(true)
    try {
      const { data } = await usersAPI.deletePoster()
      setPosterUrl('')
      updateUser(data.user)
      toast.success('Brand poster deleted')
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not delete poster')
    } finally {
      setPosterLoading(false)
    }
  }

  const sharePoster = async () => {
    if (!posterUrl) {
      toast.error('Generate poster first')
      return
    }
    const mode = await shareLink({
      title: `${user?.name} - NexWAD Brand Poster`,
      text: `Brand poster: ${posterUrl}\nProfile: ${getUserPath(user)}`,
      url: posterUrl,
    })
    if (mode === 'copied') toast.success('Poster link copied')
  }

  const downloadPoster = () => {
    if (!posterUrl) {
      toast.error('Generate poster first')
      return
    }
    window.open(posterUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header">
            <h1 className="page-header__title">Seller Tools</h1>
            <p className="page-header__sub">
              {POSTER_FEATURE_ENABLED ? 'Manage your brand poster and featured products from one place.' : 'Manage your featured products from one place.'}
            </p>
          </div>

          {POSTER_FEATURE_ENABLED ? (
            <div className="card card-body" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="section-header-row" style={{ marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Brand Poster</h2>
                <div className="action-wrap">
                  <button type="button" className="btn btn-secondary" onClick={generatePoster} disabled={posterLoading}>
                    {posterLoading ? 'Generating...' : 'Generate Poster'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={sharePoster} disabled={posterLoading || !posterUrl}>
                    Share Poster
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={downloadPoster} disabled={posterLoading || !posterUrl}>
                    Download Poster
                  </button>
                  <button type="button" className="btn btn-danger" onClick={deletePoster} disabled={posterLoading || !posterUrl}>
                    Delete Poster
                  </button>
                </div>
              </div>
              {posterUrl ? (
                <div style={{ border: '1px solid var(--nw-gray-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', maxWidth: 420 }}>
                  <img src={posterUrl} alt="Seller brand poster" style={{ width: '100%', display: 'block' }} />
                </div>
              ) : (
                <p className="caption">No poster generated yet.</p>
              )}
            </div>
          ) : null}

          <div className="card card-body">
            <div className="section-header-row" style={{ marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Featured Products (up to 3)</h2>
              <button type="button" className="btn btn-primary" onClick={saveFeaturedProducts} disabled={savingFeatured}>
                {savingFeatured ? 'Saving...' : 'Save Featured'}
              </button>
            </div>

            {loadingListings ? (
              <div className="caption">Loading products...</div>
            ) : activeListings.length === 0 ? (
              <div className="caption">No active listings yet. Create products in Marketplace first.</div>
            ) : (
              <div className="grid-3">
                {activeListings.map((item) => {
                  const selected = selectedProducts.includes(String(item._id))
                  return (
                    <button
                      key={item._id}
                      type="button"
                      className="card"
                      style={{ textAlign: 'left', border: selected ? '2px solid var(--nw-primary)' : undefined }}
                      onClick={() => toggleFeatured(item._id)}
                    >
                      <div style={{ padding: 'var(--space-3)' }}>
                        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 10, background: 'var(--nw-gray-100)' }}>
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nw-gray-400)' }}>
                              <i className="fa-solid fa-image" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                        <div className="caption">₦{(item.price || 0).toLocaleString()}</div>
                        <div className="caption" style={{ marginTop: 6, color: selected ? 'var(--nw-primary)' : 'var(--nw-gray-500)' }}>
                          {selected ? 'Selected' : 'Tap to select'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="action-wrap" style={{ marginTop: 'var(--space-5)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Open Dashboard</button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/marketplace?mine=true')}>Manage Listings</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
