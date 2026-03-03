import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { ListingCard, PostCard } from '../components/Card'
import { useAuth } from '../hooks/useAuth'
import { usersAPI, listingsAPI, subscriptionsAPI, chatAPI, postsAPI } from '../api/endpoints'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { resetSocialMeta, setSocialMeta, shareLink } from '../utils/socialMeta'
import { getDefaultRouteForUser } from '../utils/roleRouting'
import { getUserPath } from '../utils/userPath'
import { getVerificationBadge } from '../utils/verification'
import VerificationBadge from '../components/VerificationBadge'
import { DEPARTMENTS, LEVEL_OPTIONS } from '../constants/academics'
import ReportActionMenu from '../components/ReportActionMenu'

const PLAN_INFO = {
  basic: { name: 'Regular Buyer', color: 'var(--nw-gray-500)', bg: 'var(--nw-gray-100)' },
  premium_buyer: { name: 'Verified', color: '#1d4ed8', bg: '#dbeafe' },
  seller_basic: { name: 'Basic Seller', color: '#92400e', bg: 'var(--nw-gold-light)' },
  seller_pro: { name: 'Pro Seller', color: '#92400e', bg: 'var(--nw-gold-light)' },
  seller_elite: { name: 'Elite Seller', color: '#92400e', bg: 'var(--nw-gold-light)' },
  silver: { name: 'Verified', color: '#1d4ed8', bg: '#dbeafe' },
  gold: { name: 'Pro Seller', color: '#92400e', bg: 'var(--nw-gold-light)' },
  premium: { name: 'Elite Seller', color: '#92400e', bg: 'var(--nw-gold-light)' },
}

function normalizeWebsiteUrl(website) {
  const raw = String(website || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
}

export default function Profile() {
  const { userId, username } = useParams()
  const { user: currentUser, updateUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const profileIdentifier = userId || username
  const isOwn = !profileIdentifier || (
    Boolean(currentUser?._id) && (
      profileIdentifier === currentUser._id
      || profileIdentifier.toLowerCase() === String(currentUser.username || '').toLowerCase()
    )
  )

  const [profile, setProfile] = useState(isOwn ? currentUser : null)
  const [listings, setListings] = useState([])
  const [posts, setPosts] = useState([])
  const [savedListings, setSavedListings] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [loading, setLoading] = useState(Boolean(profileIdentifier) && !isOwn)
  const [activeTab, setActiveTab] = useState('listings')
  const [showSubModal, setShowSubModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editAvatarFile, setEditAvatarFile] = useState(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [followingAction, setFollowingAction] = useState(false)
  const [messagingAction, setMessagingAction] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      if (!profileIdentifier) {
        setProfile(currentUser || null)
        if (currentUser?._id) {
          try {
            const [listingsRes, postsRes] = await Promise.allSettled([
              listingsAPI.getAll({ seller: currentUser._id }),
              postsAPI.getMine(),
            ])
            if (mounted) {
              setListings(listingsRes.status === 'fulfilled' ? (listingsRes.value?.data?.listings || []) : [])
              setPosts(postsRes.status === 'fulfilled' ? (postsRes.value?.data?.posts || []) : [])
            }
          } catch {
            if (mounted) {
              setListings([])
              setPosts([])
            }
          }
        } else if (mounted) {
          setListings([])
          setPosts([])
        }
        if (mounted) setLoading(false)
        return
      }

      if (isOwn && currentUser?._id) {
        setProfile(currentUser)
        try {
          const [listingsRes, postsRes] = await Promise.allSettled([
            listingsAPI.getAll({ seller: currentUser._id }),
            postsAPI.getMine(),
          ])
          if (mounted) {
            setListings(listingsRes.status === 'fulfilled' ? (listingsRes.value?.data?.listings || []) : [])
            setPosts(postsRes.status === 'fulfilled' ? (postsRes.value?.data?.posts || []) : [])
          }
        } catch {
          if (mounted) {
            setListings([])
            setPosts([])
          }
        }
        if (mounted) setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data } = await usersAPI.getProfile(profileIdentifier)
        if (!mounted) return
        setProfile(data.user)
        const [listingsRes, postsRes] = await Promise.allSettled([
          listingsAPI.getAll({ seller: data.user?._id }),
          postsAPI.getByAuthor(data.user?.username || data.user?._id),
        ])
        if (mounted) {
          setListings(listingsRes.status === 'fulfilled' ? (listingsRes.value?.data?.listings || []) : [])
          setPosts(postsRes.status === 'fulfilled' ? (postsRes.value?.data?.posts || []) : [])
        }
      } catch {
        if (mounted) navigate(getDefaultRouteForUser(currentUser))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfile()
    return () => { mounted = false }
  }, [profileIdentifier, isOwn, currentUser, navigate])

  useEffect(() => {
    if (!isOwn || activeTab !== 'saved') return
    let mounted = true
    setSavedLoading(true)
    listingsAPI.getSaved()
      .then(({ data }) => {
        if (!mounted) return
        setSavedListings(data.listings || [])
      })
      .catch(() => {
        if (!mounted) return
        setSavedListings([])
      })
      .finally(() => {
        if (mounted) setSavedLoading(false)
      })
    return () => { mounted = false }
  }, [isOwn, activeTab])

  useEffect(() => {
    if (!profile && !currentUser) return
    const p = profile || currentUser
    if (!p?._id) return

    setSocialMeta({
      title: `${p.name} - NexWAD Profile`,
      description: p.bio || `${p.name}'s profile on NexWAD`,
      image: p.avatar || '/nexwad-social.png',
      url: getUserPath(p),
      type: 'profile',
    })
    return () => resetSocialMeta()
  }, [profile, currentUser])

  useEffect(() => {
    const currentProfile = profile || currentUser
    const sellerProfile = currentProfile?.role === 'seller'
    const tabs = sellerProfile
      ? ['listings', 'posts', 'about', ...(isOwn ? ['saved'] : [])]
      : ['posts', 'about', ...(isOwn ? ['saved'] : [])]
    const defaultTab = sellerProfile ? 'listings' : 'posts'
    if (!tabs.includes(activeTab)) setActiveTab(defaultTab)
  }, [activeTab, profile, currentUser, isOwn])

  const handleFollow = async () => {
    if (!currentUser?._id) {
      toast.error('Login required to follow users')
      navigate('/login')
      return
    }
    if (!profile?._id || followingAction) return
    setFollowingAction(true)
    try {
      if (profile.isFollowing) {
        const { data } = await usersAPI.unfollow(profile._id)
        setProfile(p => ({
          ...p,
          isFollowing: data.isFollowing,
          followerCount: data.followerCount,
          followingCount: data.followingCount,
        }))
        toast.success('Unfollowed')
      } else {
        const { data } = await usersAPI.follow(profile._id)
        setProfile(p => ({
          ...p,
          isFollowing: data.isFollowing,
          followerCount: data.followerCount,
          followingCount: data.followingCount,
        }))
        toast.success('Following')
      }
    } catch (err) { toast.error(err?.error || err?.message || 'Action failed') }
    finally { setFollowingAction(false) }
  }

  const handleMessageUser = async () => {
    if (!currentUser?._id) {
      toast.error('Login required to message users')
      navigate('/login')
      return
    }
    const targetId = (profile || currentUser)?._id
    if (!targetId || messagingAction) return
    setMessagingAction(true)
    try {
      const { data } = await chatAPI.getOrCreate(null, targetId)
      navigate(`/chat/${data.chat._id}`)
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not open chat')
    } finally {
      setMessagingAction(false)
    }
  }

  const handleSaveEdit = async () => {
    setSavingEdit(true)
    try {
      let latestUser = null

      if (editAvatarFile) {
        const fd = new FormData()
        fd.append('avatar', editAvatarFile)
        const avatarRes = await usersAPI.uploadAvatar(fd)
        latestUser = avatarRes?.data?.user || latestUser
      }

      const { data } = await usersAPI.updateProfile(editForm)
      latestUser = data?.user || latestUser

      if (latestUser) {
        updateUser(latestUser)
        setProfile(latestUser)
      }
      setEditMode(false)
      setEditAvatarFile(null)
      setEditAvatarPreview('')
      toast.success('Profile updated')
    } catch (err) { toast.error(err?.error || err?.message || 'Failed to update') }
    finally { setSavingEdit(false) }
  }

  const handleShareProfile = async () => {
    const p = profile || currentUser
    if (!p?._id) return
    try {
      const mode = await shareLink({
        title: `${p.name} - NexWAD`,
        text: `Check out ${p.name}'s profile on NexWAD`,
        url: getUserPath(p),
      })
      if (mode === 'copied') toast.success('Profile link copied')
      if (mode === 'unsupported') toast.error('Sharing not supported on this device')
    } catch {
      toast.error('Could not share profile')
    }
  }

  if (loading || (isOwn && authLoading && !currentUser)) return (
    <div><Navbar /><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div></div>
  )

  const p = profile || currentUser
  const plan = PLAN_INFO[p?.subscription?.plan || 'basic']
  const initials = p?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const isSellerProfile = p?.role === 'seller'
  const sellerCategories = [...new Set((listings || []).map((item) => item?.category).filter(Boolean))].slice(0, 4)
  const sellerSince = p?.createdAt
    ? new Date(p.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short' })
    : null
  const verification = getVerificationBadge(p)
  const websiteHref = normalizeWebsiteUrl(p?.website)
  const profileTabs = isSellerProfile
    ? ['listings', 'posts', 'about', ...(isOwn ? ['saved'] : [])]
    : ['posts', 'about', ...(isOwn ? ['saved'] : [])]

  const likePost = async (postId, wasLiked) => {
    if (wasLiked) await postsAPI.unlike(postId)
    else await postsAPI.like(postId)
    setPosts(prev => prev.map((post) => (
      post._id === postId
        ? {
            ...post,
            isLiked: !wasLiked,
            likeCount: Math.max(0, (post.likeCount ?? post.likes?.length ?? 0) + (wasLiked ? -1 : 1)),
          }
        : post
    )))
  }

  const openPostComments = (postId) => {
    navigate(`/social/post/${encodeURIComponent(postId)}`)
  }

  const reportProfile = async (reason) => {
    if (!currentUser?._id) throw new Error('Login required to report profiles')
    if (!p?._id) return
    await usersAPI.report(p._id, reason)
  }

  const renderProfileActions = (buttonSize = 'btn-sm') => {
    if (isOwn) {
      return (
        <>
          <button
            type="button"
            className={`btn btn-secondary ${buttonSize}`}
            onClick={() => {
              if (!p) return
              setEditMode(true)
              setEditForm({
                name: p.name || '',
                username: p.username || '',
                bio: p.bio || '',
                phone: p.phone || '',
                website: p.website || '',
                department: p.department || '',
                level: p.level || '',
              })
              setEditAvatarFile(null)
              setEditAvatarPreview(p.avatar || '')
            }}
            disabled={!p}
          >
            Edit Profile
          </button>
          <button type="button" className={`btn btn-ghost ${buttonSize}`} onClick={handleShareProfile} disabled={!p?._id}>
            Share Profile
          </button>
          {isSellerProfile && (
            <button
              type="button"
              className={`btn btn-secondary ${buttonSize}`}
              onClick={() => navigate('/profile/seller-tools')}
              disabled={!p?._id}
            >
              Seller Tools
            </button>
          )}
          <button type="button" className={`btn btn-ghost ${buttonSize}`} onClick={() => setShowSubModal(true)} disabled={!p}>
            {p?.subscription?.plan ? 'Manage Plan' : <><i className="fa-solid fa-star" aria-hidden="true" /> Go Premium</>}
          </button>
        </>
      )
    }

    return (
      <>
        <button type="button" className={`btn btn-primary ${buttonSize}`} onClick={handleMessageUser} disabled={messagingAction || !p?._id}>
          {messagingAction ? 'Opening...' : (isSellerProfile ? 'Message Seller' : 'Message')}
        </button>
        <button type="button" className={`btn btn-secondary ${buttonSize}`} onClick={handleShareProfile} disabled={!p?._id}>Share</button>
        <button
          type="button"
          className={`btn ${buttonSize} ${profile?.isFollowing ? 'btn-secondary' : 'btn-primary'}`}
          onClick={handleFollow}
          disabled={followingAction || !p?._id}
        >
          {profile?.isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      </>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          {/* Profile Header */}
          {isSellerProfile ? (
            <section className="seller-showcase" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="seller-showcase__hero">
                <div className="seller-showcase__identity">
                  <div className="avatar avatar-xl seller-showcase__avatar" style={{ width: 96, height: 96, fontSize: '2.2rem' }}>
                    {p?.avatar ? <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials}
                  </div>
                  <div className="seller-showcase__meta">
                    <p className="seller-showcase__eyebrow">Campus Storefront</p>
                    <h1 className="seller-showcase__title">
                      {p?.name}
                      {verification && <VerificationBadge variant={verification.variant} label={verification.label} size={16} className="ml-1" />}
                    </h1>
                    {p?.username && <p className="seller-showcase__handle">@{p.username}</p>}
                    <p className="seller-showcase__sub">
                      {(p?.department || 'AFIT Kaduna')} {p?.level ? `· ${p.level}L` : ''} {sellerSince ? `· Selling since ${sellerSince}` : ''}
                    </p>
                    {websiteHref && (
                      <a href={websiteHref} target="_blank" rel="noreferrer" className="seller-showcase__handle" style={{ display: 'inline-block' }}>
                        {p?.website}
                      </a>
                    )}
                    <div className="seller-showcase__badges">
                      <span className="badge badge-gray"><i className="fa-solid fa-store" aria-hidden="true" /> Seller</span>
                      <span className="badge" style={{ background: plan.bg, color: plan.color }}>{plan.name}</span>
                    </div>
                  </div>
                </div>
                <div className="seller-showcase__actions">
                  {!isOwn && (
                    <ReportActionMenu
                      onReport={reportProfile}
                      entityLabel="profile"
                      buttonClassName="post-card__menu-btn"
                    />
                  )}
                  {renderProfileActions()}
                </div>
              </div>
              <div className="seller-showcase__stats">
                <article className="seller-stat-card">
                  <div className="seller-stat-card__label">Active Listings</div>
                  <div className="seller-stat-card__value">{listings.length}</div>
                </article>
                <article className="seller-stat-card">
                  <div className="seller-stat-card__label">Followers</div>
                  <div className="seller-stat-card__value">{p?.followerCount || 0}</div>
                </article>
                <article className="seller-stat-card">
                  <div className="seller-stat-card__label">Store Rating</div>
                  <div className="seller-stat-card__value">
                    {p?.rating ? `${Number(p.rating).toFixed(1)}★` : 'New'}
                  </div>
                </article>
                <article className="seller-stat-card">
                  <div className="seller-stat-card__label">Community</div>
                  <div className="seller-stat-card__value">{p?.followingCount || 0} Following</div>
                </article>
              </div>
              <div className="seller-showcase__story">
                <h3>About This Store</h3>
                <p>{p?.bio || 'Trusted campus seller. Explore listings for quality items and quick responses.'}</p>
                {sellerCategories.length > 0 && (
                  <div className="seller-showcase__chips">
                    {sellerCategories.map((category) => (
                      <span key={category} className="seller-chip">{category}</span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : (
            <div className="card card-body profile-header" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="profile-header__layout" style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="avatar avatar-xl" style={{ width: 88, height: 88, fontSize: '2rem' }}>
                  {p?.avatar ? <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.375rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {p?.name}
                      {verification && <VerificationBadge variant={verification.variant} label={verification.label} size={15} />}
                    </h1>
                    <span className="badge" style={{ background: plan.bg, color: plan.color }}>{plan.name}</span>
                  </div>
                  {p?.username && (
                    <p style={{ color: 'var(--nw-primary)', fontSize: '0.9rem', marginBottom: 6, fontWeight: 600 }}>@{p.username}</p>
                  )}
                  {websiteHref && (
                    <a href={websiteHref} target="_blank" rel="noreferrer" style={{ color: 'var(--nw-primary)', fontSize: '0.875rem', marginBottom: 8, display: 'inline-block', fontWeight: 600 }}>
                      {p?.website}
                    </a>
                  )}
                  <p style={{ color: 'var(--nw-gray-500)', fontSize: '0.9rem', marginBottom: 8 }}>
                    {p?.department} · {p?.level} · AFIT Kaduna
                  </p>
                  {p?.bio && <p style={{ color: 'var(--nw-gray-600)', fontSize: '0.9375rem', marginBottom: 12, maxWidth: 520 }}>{p.bio}</p>}
                  <div style={{ display: 'flex', gap: 'var(--space-6)', fontSize: '0.875rem', color: 'var(--nw-gray-500)', flexWrap: 'wrap' }}>
                    <span><strong style={{ color: 'var(--nw-ink)' }}>{p?.followerCount || 0}</strong> Followers</span>
                    <span><strong style={{ color: 'var(--nw-ink)' }}>{p?.followingCount || 0}</strong> Following</span>
                  </div>
                </div>
                <div className="profile-header__actions" style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
                  {!isOwn && (
                    <ReportActionMenu
                      onReport={reportProfile}
                      entityLabel="profile"
                      buttonClassName="post-card__menu-btn"
                    />
                  )}
                  {renderProfileActions()}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
            {profileTabs.map(t => (
              <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'listings' && (
            listings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon" style={{ fontSize: '2rem' }}><i className="fa-solid fa-box-open" aria-hidden="true" /></div>
                <div className="empty-state__title">No listings yet</div>
              </div>
            ) : (
              <div className="grid-3">
                {listings.map(l => <ListingCard key={l._id} listing={l} />)}
              </div>
            )
          )}

          {activeTab === 'about' && (
            <div className="card card-body" style={{ maxWidth: 500 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>About</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '0.9rem' }}>
                {[
                  { label: 'Department', value: p?.department },
                  { label: 'Level', value: p?.level ? `${p.level}L` : null },
                  ...(isOwn ? [{ label: 'Matric Number', value: p?.matricNumber }] : []),
                  { label: 'Website', value: p?.website, href: websiteHref },
                  { label: 'Member Since', value: p?.createdAt ? new Date(p.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long' }) : null },
                  { label: 'Rating', value: p?.rating ? `${p.rating}/5` : 'No ratings yet' },
                ].filter((item) => item.value).map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--nw-gray-100)', paddingBottom: 'var(--space-3)' }}>
                    <span style={{ color: 'var(--nw-gray-500)' }}>{item.label}</span>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noreferrer" style={{ fontWeight: 500, color: 'var(--nw-primary)' }}>
                        {item.value}
                      </a>
                    ) : (
                      <span style={{ fontWeight: 500 }}>{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon" style={{ fontSize: '2rem' }}><i className="fa-solid fa-comments" aria-hidden="true" /></div>
                <div className="empty-state__title">No posts yet</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 720 }}>
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={likePost}
                    onComment={openPostComments}
                  />
                ))}
              </div>
            )
          )}

          {activeTab === 'saved' && isOwn && (
            savedLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : savedListings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon" style={{ fontSize: '2rem' }}><i className="fa-solid fa-bookmark" aria-hidden="true" /></div>
                <div className="empty-state__title">No saved listings yet</div>
              </div>
            ) : (
              <div className="grid-3">
                {savedListings.map((item) => <ListingCard key={item._id} listing={item} />)}
              </div>
            )
          )}
        </main>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editMode} onClose={() => { setEditMode(false); setEditAvatarFile(null); setEditAvatarPreview('') }} title="Edit Profile"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setEditMode(false); setEditAvatarFile(null); setEditAvatarPreview('') }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Changes'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Profile Photo</label>
            <label className="upload-area" htmlFor="profile-avatar-upload" style={{ cursor: 'pointer', padding: 'var(--space-5)' }}>
              {editAvatarPreview ? (
                <img
                  src={editAvatarPreview}
                  alt="Avatar preview"
                  style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--nw-gray-200)' }}
                />
              ) : (
                <>
                  <div className="upload-area__icon"><i className="fa-solid fa-camera" aria-hidden="true" /></div>
                  <div style={{ fontWeight: 500 }}>Tap to upload photo</div>
                </>
              )}
              <input
                id="profile-avatar-upload"
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setEditAvatarFile(file)
                  setEditAvatarPreview(URL.createObjectURL(file))
                }}
              />
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input type="text" className="form-input" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="your_handle"
              value={editForm.username || ''}
              onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-textarea" placeholder="Tell students about yourself..." value={editForm.bio || ''} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="tel" className="form-input" placeholder="+234 800 000 0000" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Website (optional)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://your-site.com"
              value={editForm.website || ''}
              onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select
              className="form-select"
              value={editForm.department || ''}
              onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Level</label>
            <select
              className="form-select"
              value={editForm.level || ''}
              onChange={e => setEditForm(f => ({ ...f, level: e.target.value }))}
            >
              <option value="">Select level</option>
              {LEVEL_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}L</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <SubscriptionModal isOpen={showSubModal} onClose={() => setShowSubModal(false)} currentPlan={p?.subscription?.plan} />
    </div>
  )
}

function SubscriptionModal({ isOpen, onClose, currentPlan }) {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [subscribing, setSubscribing] = useState(null)

  useEffect(() => {
    if (isOpen) {
      subscriptionsAPI.getPlans().then(({ data }) => setPlans(data.plans || [])).catch(() => {})
    }
  }, [isOpen])

  const subscribe = async (planId) => {
    setSubscribing(planId)
    try {
      await subscriptionsAPI.subscribe(planId, {})
      toast.success('Subscription activated!')
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Payment failed')
    } finally {
      setSubscribing(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Your Plan" size="lg">
      {plans.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {plans.map(plan => {
            const isCurrent = plan._id === currentPlan
            const isFeatured = plan.featured
            return (
              <div key={plan._id} className="plan-card" style={isFeatured ? { borderColor: 'var(--nw-primary)', background: 'var(--nw-ink)', color: 'white' } : {}}>
                {isFeatured && <span className="plan-card__badge">Most Popular</span>}
                <div className="plan-card__name" style={isFeatured ? { color: 'rgba(255,255,255,0.7)' } : {}}>{plan.name}</div>
                <div className="plan-card__price" style={isFeatured ? { color: 'white' } : {}}>
                  <sub>₦</sub>{plan.price.toLocaleString()}
                </div>
                <div className="plan-card__period" style={isFeatured ? { color: 'rgba(255,255,255,0.5)' } : {}}>/month</div>
                <div className="plan-card__features">
                  {(plan.features || []).map(f => (
                    <div key={f} className="plan-feature" style={isFeatured ? { color: 'rgba(255,255,255,0.8)' } : { color: 'var(--nw-gray-600)' }}>
                      <svg width="14" height="14" fill="none" stroke={isFeatured ? 'rgba(255,255,255,0.7)' : 'var(--nw-green)'} strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
                <button
                  className="btn"
                  style={isFeatured
                    ? { background: 'white', color: 'var(--nw-primary)', width: '100%' }
                    : { background: 'var(--nw-primary)', color: 'white', width: '100%' }}
                  onClick={() => {
                    if (plan.type === 'seller') {
                      onClose()
                      navigate(`/profile/become-seller?plan=${plan._id}`)
                      return
                    }
                    subscribe(plan._id)
                  }}
                  disabled={isCurrent || !!subscribing}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : plan.type === 'seller'
                      ? `Apply as ${plan.name}`
                      : subscribing === plan._id
                        ? <span className="spinner" style={{ width: 18, height: 18 }} />
                        : `Get ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
