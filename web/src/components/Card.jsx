import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listingsAPI, pinsAPI, postsAPI } from '../api/endpoints'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { canPinContent, formatPinTimeLeft } from '../utils/pins'
import { getUserPath } from '../utils/userPath'
import { getVerificationBadge } from '../utils/verification'
import VerificationBadge from './VerificationBadge'
import { shareLink } from '../utils/socialMeta'
import ReportActionMenu from './ReportActionMenu'

function HeartIcon({ filled }) {
  return filled
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
}

function StarIcon() {
  return <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}

/**
 * Listing Card — used in Marketplace grid
 */
export function ListingCard({ listing }) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [saved, setSaved] = useState(listing.isSaved ?? false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [pinData, setPinData] = useState(listing.pin || null)
  const [pinLoading, setPinLoading] = useState(false)

  const {
    _id,
    title,
    price,
    originalPrice,
    images = [],
    category,
    seller,
    isPremium,
    createdAt,
  } = listing
  const isPinned = Boolean(pinData && new Date(pinData.expiresAt).getTime() > Date.now())
  const isOwner = Boolean(user?._id && seller?._id && user._id === seller._id)
  const canPin = isOwner && canPinContent(user)
  const sellerBadge = getVerificationBadge(seller)

  const toggleSave = async (e) => {
    e.stopPropagation()
    if (saveLoading) return
    setSaveLoading(true)
    try {
      if (saved) {
        await listingsAPI.unsave(_id)
        setSaved(false)
      } else {
        await listingsAPI.save(_id)
        setSaved(true)
      }
    } catch (err) {
      toast.error(err?.error || err?.message || 'Login required to save listings')
    }
    setSaveLoading(false)
  }

  const togglePin = async (e) => {
    e.stopPropagation()
    if (pinLoading) return
    if (!isAuthenticated) {
      toast.error('Login required')
      return
    }
    if (!canPin) {
      toast.error('Only sellers or premium users can pin their own content')
      return
    }

    setPinLoading(true)
    try {
      if (isPinned) {
        await pinsAPI.unpin(pinData._id)
        setPinData(null)
        toast.success('Unpinned')
      } else {
        const { data } = await pinsAPI.initialize({
          targetType: 'listing',
          targetId: _id,
          units: 1,
        })
        setPinData(data?.pin || null)
        toast.success('Pinned for 24 hours')
      }
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not update pin')
    } finally {
      setPinLoading(false)
    }
  }

  const reportListing = async (reason) => {
    if (!isAuthenticated) {
      throw new Error('Login required to report listings')
    }
    await listingsAPI.report(_id, reason)
  }

  return (
    <article className={`listing-card ${isPinned ? 'pinned-card' : ''}`} onClick={() => navigate(`/marketplace/${_id}`)}>
      <div className="listing-card__image">
        <img
          src={images[0] || '/placeholder.jpg'}
          alt={title}
          loading="lazy"
        />
        {isPinned && (
          <span className="pin-badge">
            <i className="fa-solid fa-thumbtack" aria-hidden="true" /> Pinned
          </span>
        )}
        {isPremium && (
          <span className="listing-card__premium-badge" style={{ top: isPinned ? 40 : undefined }}>
            <StarIcon /> Premium
          </span>
        )}
        <button
          className={`listing-card__save-btn ${saved ? 'saved' : ''}`}
          onClick={toggleSave}
          aria-label={saved ? 'Unsave listing' : 'Save listing'}
        >
          <HeartIcon filled={saved} />
        </button>
        {!isOwner && (
          <div style={{ position: 'absolute', top: 'var(--space-3)', right: 44 }}>
            <ReportActionMenu
              onReport={reportListing}
              entityLabel="product"
              buttonClassName="post-card__menu-btn"
              buttonAriaLabel="Open product actions"
            />
          </div>
        )}
      </div>

      <div className="listing-card__body">
        <div className="listing-card__category">{category}</div>
        <h3 className="listing-card__title">{title}</h3>

        <div className="listing-card__price">
          ₦{price?.toLocaleString()}
          {originalPrice && originalPrice > price && (
            <span>₦{originalPrice?.toLocaleString()}</span>
          )}
        </div>

        <div className="listing-card__footer">
          <button
            type="button"
            className="listing-card__seller"
            onClick={(e) => {
              e.stopPropagation()
              if (seller?._id) navigate(getUserPath(seller))
            }}
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
            aria-label={seller?.name ? `View ${seller.name} profile` : 'View seller profile'}
          >
            <div className="avatar avatar-sm" style={{ width: 22, height: 22, fontSize: '0.6875rem' }}>
              {seller?.avatar
                ? <img src={seller.avatar} alt={seller.name} style={{ width: '100%', borderRadius: '50%' }} />
                : seller?.name?.[0]}
            </div>
            {seller?.name}
            {sellerBadge && <VerificationBadge variant={sellerBadge.variant} label={sellerBadge.label} size={12} className="ml-1" />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isPinned && <span className="caption" style={{ color: '#92400e' }}>{formatPinTimeLeft(pinData?.expiresAt)}</span>}
            {canPin && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={togglePin} disabled={pinLoading}>
                {pinLoading ? '...' : isPinned ? 'Unpin' : 'Pin'}
              </button>
            )}
            <span className="caption">{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * Post Card — used in Social feed
 */
export function PostCard({ post, onLike, onComment }) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [liked, setLiked] = useState(post.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(post.likeCount ?? post.likes?.length ?? 0)
  const [pinData, setPinData] = useState(post.pin || null)
  const [pinLoading, setPinLoading] = useState(false)
  const userBadge = getVerificationBadge(post.author)
  const isPinned = Boolean(pinData && new Date(pinData.expiresAt).getTime() > Date.now())
  const isOwner = Boolean(user?._id && post.author?._id && user._id === post.author._id)
  const canPin = isOwner && canPinContent(user)
  const canSeePinTime = isPinned && isOwner

  const handleLike = async (event) => {
    event.stopPropagation()
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(c => wasLiked ? c - 1 : c + 1)
    try { await onLike?.(post._id, wasLiked) } catch { setLiked(wasLiked); setLikeCount(c => wasLiked ? c + 1 : c - 1) }
  }
  const handleComment = async (event) => {
    event.stopPropagation()
    if (!onComment) return
    await onComment(post._id)
  }

  const handleShare = async (event) => {
    event.stopPropagation()
    try {
      const postPath = `/social/post/${encodeURIComponent(post._id)}`
      const mode = await shareLink({
        title: `${post.author?.name || 'Student'} on NexWAD`,
        text: post.content
          ? `${String(post.content).slice(0, 120)}${post.content.length > 120 ? '...' : ''}`
          : 'Check out this post on NexWAD.',
        url: postPath,
      })
      if (mode === 'copied') toast.success('Post link copied')
      if (mode === 'unsupported') toast.error('Sharing not supported on this device')
    } catch {
      toast.error('Could not share post')
    }
  }

  const togglePin = async () => {
    if (pinLoading) return
    if (!isAuthenticated) {
      toast.error('Login required')
      return
    }
    if (!canPin) {
      toast.error('Only sellers or premium users can pin their own content')
      return
    }

    setPinLoading(true)
    try {
      if (isPinned) {
        await pinsAPI.unpin(pinData._id)
        setPinData(null)
        toast.success('Unpinned')
      } else {
        const { data } = await pinsAPI.initialize({
          targetType: 'post',
          targetId: post._id,
          units: 1,
        })
        setPinData(data?.pin || null)
        toast.success('Pinned for 24 hours')
      }
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not update pin')
    } finally {
      setPinLoading(false)
    }
  }

  const reportPost = async (reason) => {
    if (!isAuthenticated) {
      throw new Error('Login required to report posts')
    }
    await postsAPI.report(post._id, reason)
  }

  return (
    <article
      className={`post-card ${isPinned ? 'pinned-card' : ''}`}
      onClick={() => navigate(`/social/post/${post._id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="post-card__header">
        <div
          className="avatar avatar-md"
          style={{ cursor: 'pointer' }}
          onClick={(event) => {
            event.stopPropagation()
            navigate(getUserPath(post.author))
          }}
        >
          {post.author?.avatar
            ? <img src={post.author.avatar} alt={post.author.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : post.author?.name?.[0]}
        </div>
        <div className="post-card__user-info">
          <div className="post-card__username" style={{ cursor: 'pointer' }} onClick={(event) => {
            event.stopPropagation()
            navigate(getUserPath(post.author))
          }}>
            {post.author?.name}
            {userBadge && <VerificationBadge variant={userBadge.variant} label={userBadge.label} size={13} className="ml-1" />}
            {isPinned && (
              <span className="pin-badge" style={{ marginLeft: 6, position: 'static' }}>
                <i className="fa-solid fa-thumbtack" aria-hidden="true" /> Pinned
              </span>
            )}
          </div>
          <div className="post-card__meta">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            {post.author?.department && ` · ${post.author.department}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {canSeePinTime && <span className="caption">{formatPinTimeLeft(pinData?.expiresAt)}</span>}
          {canPin && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={(event) => { event.stopPropagation(); togglePin() }} disabled={pinLoading}>
              {pinLoading ? '...' : isPinned ? 'Unpin' : 'Pin'}
            </button>
          )}
          {!isOwner && <ReportActionMenu onReport={reportPost} entityLabel="post" />}
        </div>
      </div>

      {post.content && <p className="post-card__content">{post.content}</p>}

      {post.image && (
        <div className="post-card__image">
          <img src={post.image} alt="Post" loading="lazy" />
        </div>
      )}

      <div className="post-card__actions">
        <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <svg width="16" height="16" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          {likeCount}
        </button>
        <button className="post-action-btn" onClick={handleComment}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {post.commentCount ?? post.comments?.length ?? 0}
        </button>
        <div className="post-action-btn" style={{ cursor: 'default' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
          {post.views ?? 0}
        </div>
        <button className="post-action-btn" onClick={handleShare}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share
        </button>
      </div>
    </article>
  )
}

export default ListingCard
