import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listingsAPI } from '../api/endpoints'
import { formatDistanceToNow } from 'date-fns'

function HeartIcon({ filled }) {
  return filled
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
}

function StarIcon() {
  return <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}

function getUserBadge(user) {
  if (!user) return null
  if (user.role === 'seller') {
    if (user.sellerTier === 'elite') return { label: 'ELITE SELLER', variant: 'gold' }
    if (user.sellerTier === 'pro') return { label: 'PRO SELLER', variant: 'gold' }
    return { label: 'SELLER', variant: 'gold' }
  }
  if (user.buyerType === 'premium') return { label: 'Verified', variant: 'verified' }
  return null
}

/**
 * Listing Card — used in Marketplace grid
 */
export function ListingCard({ listing }) {
  const navigate = useNavigate()
  const [saved, setSaved] = useState(listing.isSaved ?? false)
  const [saveLoading, setSaveLoading] = useState(false)

  const {
    _id,
    title,
    price,
    originalPrice,
    images = [],
    category,
    seller,
    isPremium,
    condition,
    createdAt,
  } = listing

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
    } catch { /* silent */ }
    setSaveLoading(false)
  }

  return (
    <article className="listing-card" onClick={() => navigate(`/marketplace/${_id}`)}>
      <div className="listing-card__image">
        <img
          src={images[0] || '/placeholder.jpg'}
          alt={title}
          loading="lazy"
        />
        {isPremium && (
          <span className="listing-card__premium-badge">
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
              if (seller?._id) navigate(`/profile/${seller._id}`)
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
          </button>
          <span className="caption">{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
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
  const [liked, setLiked] = useState(post.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(post.likeCount ?? post.likes?.length ?? 0)
  const userBadge = getUserBadge(post.author)

  const handleLike = async () => {
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(c => wasLiked ? c - 1 : c + 1)
    try { await onLike?.(post._id, wasLiked) } catch { setLiked(wasLiked); setLikeCount(c => wasLiked ? c + 1 : c - 1) }
  }
  const handleComment = async () => {
    if (!onComment) return
    await onComment(post._id)
  }

  return (
    <article className="post-card">
      <div className="post-card__header">
        <div
          className="avatar avatar-md"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/profile/${post.author?._id}`)}
        >
          {post.author?.avatar
            ? <img src={post.author.avatar} alt={post.author.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : post.author?.name?.[0]}
        </div>
        <div className="post-card__user-info">
          <div className="post-card__username" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.author?._id}`)}>
            {post.author?.name}
            {userBadge && (
              userBadge.variant === 'verified' ? (
                <span
                  className="badge badge-verified"
                  style={{ marginLeft: 6, fontSize: '0.65rem' }}
                  aria-label="Verified buyer"
                  title="Verified buyer"
                >
                  <svg
                    viewBox="0 0 22 22"
                    aria-label="Verified account"
                    role="img"
                    style={{ width: 12, height: 12, display: 'inline-block' }}
                  >
                    <g>
                      <path
                        fill="currentColor"
                        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                      />
                    </g>
                  </svg>
                </span>
              ) : (
                <span className="badge badge-gold" style={{ marginLeft: 6, fontSize: '0.65rem' }}>
                  {userBadge.label}
                </span>
              )
            )}
          </div>
          <div className="post-card__meta">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            {post.author?.department && ` · ${post.author.department}`}
          </div>
        </div>
        <button className="post-card__menu-btn">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
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
        <button className="post-action-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share
        </button>
      </div>
    </article>
  )
}

export default ListingCard
