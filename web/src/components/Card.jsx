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
          <div className="listing-card__seller">
            <div className="avatar avatar-sm" style={{ width: 22, height: 22, fontSize: '0.6875rem' }}>
              {seller?.avatar
                ? <img src={seller.avatar} alt={seller.name} style={{ width: '100%', borderRadius: '50%' }} />
                : seller?.name?.[0]}
            </div>
            {seller?.name}
          </div>
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
  const [likeCount, setLikeCount] = useState(post.likes ?? 0)

  const handleLike = async () => {
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(c => wasLiked ? c - 1 : c + 1)
    try { await onLike?.(post._id, wasLiked) } catch { setLiked(wasLiked); setLikeCount(c => wasLiked ? c + 1 : c - 1) }
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
            {post.author?.subscription?.plan === 'premium' && <span className="badge badge-gold" style={{ marginLeft: 6, fontSize: '0.65rem' }}>PRO</span>}
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
          {likeCount > 0 && likeCount}
        </button>
        <button className="post-action-btn" onClick={() => onComment?.(post._id)}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {post.commentCount > 0 && post.commentCount}
        </button>
        <button className="post-action-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share
        </button>
      </div>
    </article>
  )
}

export default ListingCard
