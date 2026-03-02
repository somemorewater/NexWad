import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { ListingCard } from '../components/Card'
import { useAuth } from '../hooks/useAuth'
import { usersAPI, listingsAPI, subscriptionsAPI, chatAPI } from '../api/endpoints'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { resetSocialMeta, setSocialMeta, shareLink } from '../utils/socialMeta'
import { getDefaultRouteForUser } from '../utils/roleRouting'

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

export default function Profile() {
  const { userId } = useParams()
  const { user: currentUser, updateUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const isOwn = !userId || userId === currentUser?._id

  const [profile, setProfile] = useState(isOwn ? currentUser : null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(!isOwn)
  const [activeTab, setActiveTab] = useState('listings')
  const [showSubModal, setShowSubModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [followingAction, setFollowingAction] = useState(false)
  const [messagingAction, setMessagingAction] = useState(false)

  useEffect(() => {
    if (!isOwn && userId) {
      usersAPI.getProfile(userId)
        .then(({ data }) => setProfile(data.user))
        .catch(() => navigate(getDefaultRouteForUser(currentUser)))
        .finally(() => setLoading(false))
    }
    const uid = isOwn ? currentUser?._id : userId
    if (uid) {
      listingsAPI.getAll({ seller: uid })
        .then(({ data }) => setListings(data.listings || []))
        .catch(() => {})
    }
  }, [userId, isOwn, currentUser, navigate])

  useEffect(() => {
    if (!profile && !currentUser) return
    const p = profile || currentUser
    if (!p?._id) return

    setSocialMeta({
      title: `${p.name} - NexWAD Profile`,
      description: p.bio || `${p.name}'s profile on NexWAD`,
      image: p.avatar || '/nexwad-social.png',
      url: `/profile/${p._id}`,
      type: 'profile',
    })
    return () => resetSocialMeta()
  }, [profile, currentUser])

  const handleFollow = async () => {
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
      const { data } = await usersAPI.updateProfile(editForm)
      updateUser(data.user)
      setProfile(data.user)
      setEditMode(false)
      toast.success('Profile updated')
    } catch { toast.error('Failed to update') }
    finally { setSavingEdit(false) }
  }

  const handleShareProfile = async () => {
    const p = profile || currentUser
    if (!p?._id) return
    try {
      const mode = await shareLink({
        title: `${p.name} - NexWAD`,
        text: `Check out ${p.name}'s profile on NexWAD`,
        url: `/profile/${p._id}`,
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

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          {/* Profile Header */}
          <div className="card card-body profile-header" style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="avatar avatar-xl" style={{ width: 88, height: 88, fontSize: '2rem' }}>
                {p?.avatar ? <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.375rem' }}>{p?.name}</h1>
                  <span className="badge" style={{ background: plan.bg, color: plan.color }}>
                    {(p?.subscription?.plan === 'premium_buyer' || p?.subscription?.plan === 'silver') && (
                      <svg
                        viewBox="0 0 22 22"
                        aria-label="Verified account"
                        role="img"
                        style={{ width: 14, height: 14, marginRight: 6, display: 'inline-block' }}
                      >
                        <g>
                          <path
                            fill="currentColor"
                            d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                          />
                        </g>
                      </svg>
                    )}
                    {plan.name}
                  </span>
                </div>
                <p style={{ color: 'var(--nw-gray-500)', fontSize: '0.9rem', marginBottom: 8 }}>
                  {p?.department} · {p?.level} · AFIT Kaduna
                </p>
                {p?.bio && <p style={{ color: 'var(--nw-gray-600)', fontSize: '0.9375rem', marginBottom: 12, maxWidth: 520 }}>{p.bio}</p>}
                <div style={{ display: 'flex', gap: 'var(--space-6)', fontSize: '0.875rem', color: 'var(--nw-gray-500)' }}>
                  <span><strong style={{ color: 'var(--nw-ink)' }}>{listings.length}</strong> Listings</span>
                  <span><strong style={{ color: 'var(--nw-ink)' }}>{p?.followerCount || 0}</strong> Followers</span>
                  <span><strong style={{ color: 'var(--nw-ink)' }}>{p?.followingCount || 0}</strong> Following</span>
                </div>
              </div>
              <div className="profile-header__actions" style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
                {isOwn ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        if (!p) return
                        setEditMode(true)
                        setEditForm({ name: p.name || '', bio: p.bio || '', phone: p.phone || '' })
                      }}
                      disabled={!p}
                    >
                      Edit Profile
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={handleShareProfile} disabled={!p?._id}>
                      Share Profile
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSubModal(true)} disabled={!p}>
                      {p?.subscription?.plan ? 'Manage Plan' : <><i className="fa-solid fa-star" aria-hidden="true" /> Go Premium</>}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleMessageUser} disabled={messagingAction || !p?._id}>
                      {messagingAction ? 'Opening...' : 'Message'}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleShareProfile} disabled={!p?._id}>Share</button>
                    <button
                      type="button"
                      className={`btn btn-sm ${profile?.isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={handleFollow}
                      disabled={followingAction || !p?._id}
                    >
                      {profile?.isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
            {['listings', 'about', ...(isOwn ? ['saved'] : [])].map(t => (
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
                  ['Department', p?.department],
                  ['Level', p?.level ? `${p.level}L` : null],
                  ['Matric Number', p?.matricNumber],
                  ['Member Since', p?.createdAt ? new Date(p.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long' }) : null],
                  ['Rating', p?.rating ? `${p.rating}/5` : 'No ratings yet'],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--nw-gray-100)', paddingBottom: 'var(--space-3)' }}>
                    <span style={{ color: 'var(--nw-gray-500)' }}>{label}</span>
                    <span style={{ fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editMode} onClose={() => setEditMode(false)} title="Edit Profile"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Changes'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input type="text" className="form-input" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-textarea" placeholder="Tell students about yourself..." value={editForm.bio || ''} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="tel" className="form-input" placeholder="+234 800 000 0000" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
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
