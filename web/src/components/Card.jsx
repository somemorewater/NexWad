import { useEffect, useState } from 'react'
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
import Modal from './Modal'

function HeartIcon({ filled }) {
  return filled
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
}

function StarIcon() {
  return <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}

const MAX_LISTING_IMAGES = 4

/**
 * Listing Card — used in Marketplace grid
 */
export function ListingCard({ listing, onUpdated, onDeleted }) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [listingData, setListingData] = useState(listing)
  const [deleted, setDeleted] = useState(false)
  const [saved, setSaved] = useState(listing.isSaved ?? false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [pinData, setPinData] = useState(listing.pin || null)
  const [pinLoading, setPinLoading] = useState(false)
  const [updatingListing, setUpdatingListing] = useState(false)
  const [deletingListing, setDeletingListing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', price: '', description: '' })
  const [editExistingImages, setEditExistingImages] = useState([])
  const [editNewImages, setEditNewImages] = useState([])

  useEffect(() => {
    setListingData(listing)
    setSaved(listing.isSaved ?? false)
    setPinData(listing.pin || null)
  }, [listing])

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
  } = listingData
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

  const openEditListingModal = (e) => {
    if (e?.stopPropagation) e.stopPropagation()
    if (!isOwner) return
    setEditForm({
      title: title || '',
      price: String(price ?? ''),
      description: listingData.description || '',
    })
    setEditExistingImages(
      (listingData.images || []).map((url, index) => ({
        url,
        publicId: listingData.imagePublicIds?.[index] || '',
        keep: true,
      }))
    )
    setEditNewImages([])
    setShowEditModal(true)
  }

  const handleListingEditImages = (event) => {
    const incoming = Array.from(event.target.files || [])
    if (!incoming.length) return
    const keptExistingCount = editExistingImages.filter((img) => img.keep).length
    const available = MAX_LISTING_IMAGES - keptExistingCount - editNewImages.length
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

  const submitListingEdit = async () => {
    if (!isOwner || updatingListing) return
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
      const { data } = await listingsAPI.update(_id, payload)
      const updatedListing = data.listing || listingData
      setListingData((prev) => ({ ...prev, ...updatedListing }))
      onUpdated?.(updatedListing)
      setShowEditModal(false)
      toast.success('Listing updated')
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not update listing')
    } finally {
      setUpdatingListing(false)
    }
  }

  const deleteListing = async (e) => {
    e.stopPropagation()
    if (!isOwner || deletingListing) return
    if (!window.confirm('Delete this listing?')) return

    setDeletingListing(true)
    try {
      await listingsAPI.delete(_id)
      setDeleted(true)
      onDeleted?.(_id)
      toast.success('Listing deleted')
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not delete listing')
    } finally {
      setDeletingListing(false)
    }
  }

  if (deleted) return null

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
        <div style={{ position: 'absolute', top: 'var(--space-3)', right: 44 }}>
          <ReportActionMenu
            actions={isOwner ? [
              {
                key: 'pin',
                label: isPinned ? 'Unpin' : 'Pin',
                onClick: (e) => togglePin(e),
                disabled: pinLoading || !canPin,
              },
              {
                key: 'edit',
                label: 'Edit',
                onClick: (e) => openEditListingModal(e),
                disabled: updatingListing,
              },
              {
                key: 'delete',
                label: 'Delete',
                danger: true,
                onClick: (e) => deleteListing(e),
                disabled: deletingListing,
              },
            ] : []}
            onReport={!isOwner ? reportListing : undefined}
            entityLabel="product"
            buttonClassName="post-card__menu-btn"
            buttonAriaLabel="Open product actions"
          />
        </div>
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
            <span className="caption">{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Listing"
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={updatingListing}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={submitListingEdit} disabled={updatingListing}>
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
              <input type="file" accept="image/*" multiple onChange={handleListingEditImages} />
            </div>
          </div>
        </div>
      </Modal>
    </article>
  )
}

/**
 * Post Card — used in Social feed
 */
export function PostCard({ post, onLike, onComment, onUpdated, onDeleted }) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [postData, setPostData] = useState(post)
  const [deleted, setDeleted] = useState(false)
  const [liked, setLiked] = useState(post.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(post.likeCount ?? post.likes?.length ?? 0)
  const [pinData, setPinData] = useState(post.pin || null)
  const [pinLoading, setPinLoading] = useState(false)
  const [updatingPost, setUpdatingPost] = useState(false)
  const [deletingPost, setDeletingPost] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editImageFile, setEditImageFile] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState('')
  const [removeEditImage, setRemoveEditImage] = useState(false)
  useEffect(() => {
    setPostData(post)
    setLiked(post.isLiked ?? false)
    setLikeCount(post.likeCount ?? post.likes?.length ?? 0)
    setPinData(post.pin || null)
  }, [post])
  const userBadge = getVerificationBadge(postData.author)
  const isPinned = Boolean(pinData && new Date(pinData.expiresAt).getTime() > Date.now())
  const isOwner = Boolean(user?._id && postData.author?._id && user._id === postData.author._id)
  const canPin = isOwner && canPinContent(user)
  const canSeePinTime = isPinned && isOwner

  const handleLike = async (event) => {
    event.stopPropagation()
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(c => wasLiked ? c - 1 : c + 1)
    try { await onLike?.(postData._id, wasLiked) } catch { setLiked(wasLiked); setLikeCount(c => wasLiked ? c + 1 : c - 1) }
  }
  const handleComment = async (event) => {
    event.stopPropagation()
    if (!onComment) return
    await onComment(postData._id)
  }

  const handleShare = async (event) => {
    event.stopPropagation()
    try {
      const postPath = `/social/post/${encodeURIComponent(postData._id)}`
      const mode = await shareLink({
        title: `${postData.author?.name || 'Student'} on NexWAD`,
        text: postData.content
          ? `${String(postData.content).slice(0, 120)}${postData.content.length > 120 ? '...' : ''}`
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
          targetId: postData._id,
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
    await postsAPI.report(postData._id, reason)
  }

  const openEditPostModal = (event) => {
    if (event?.stopPropagation) event.stopPropagation()
    if (!isOwner) return
    setEditContent(postData.content || '')
    setEditImageFile(null)
    setRemoveEditImage(false)
    setEditImagePreview(postData.image || '')
    setShowEditModal(true)
  }

  const submitPostEdit = async () => {
    if (!isOwner || updatingPost) return
    setUpdatingPost(true)
    try {
      const payload = new FormData()
      payload.append('content', String(editContent || '').trim())
      if (removeEditImage) payload.append('removeImage', 'true')
      if (editImageFile) payload.append('image', editImageFile)
      const { data } = await postsAPI.update(postData._id, payload)
      const updatedPost = data.post || { ...postData, content: String(editContent || '').trim(), image: editImagePreview || '' }
      setPostData((prev) => ({ ...prev, ...updatedPost }))
      onUpdated?.(updatedPost)
      setShowEditModal(false)
      toast.success('Post updated')
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not update post')
    } finally {
      setUpdatingPost(false)
    }
  }

  const deletePost = async (event) => {
    event.stopPropagation()
    if (!isOwner || deletingPost) return
    if (!window.confirm('Delete this post?')) return

    setDeletingPost(true)
    try {
      await postsAPI.delete(postData._id)
      setDeleted(true)
      onDeleted?.(postData._id)
      toast.success('Post deleted')
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not delete post')
    } finally {
      setDeletingPost(false)
    }
  }

  if (deleted) return null

  return (
    <article
      className={`post-card ${isPinned ? 'pinned-card' : ''}`}
      onClick={() => navigate(`/social/post/${postData._id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="post-card__header">
        <div
          className="avatar avatar-md"
          style={{ cursor: 'pointer' }}
          onClick={(event) => {
            event.stopPropagation()
            navigate(getUserPath(postData.author))
          }}
        >
          {postData.author?.avatar
            ? <img src={postData.author.avatar} alt={postData.author.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : postData.author?.name?.[0]}
        </div>
        <div className="post-card__user-info">
          <div className="post-card__username" style={{ cursor: 'pointer' }} onClick={(event) => {
            event.stopPropagation()
            navigate(getUserPath(postData.author))
          }}>
            {postData.author?.name}
            {userBadge && <VerificationBadge variant={userBadge.variant} label={userBadge.label} size={13} className="ml-1" />}
            {isPinned && (
              <span className="pin-badge" style={{ marginLeft: 6, position: 'static' }}>
                <i className="fa-solid fa-thumbtack" aria-hidden="true" /> Pinned
              </span>
            )}
          </div>
          <div className="post-card__meta">
            {formatDistanceToNow(new Date(postData.createdAt), { addSuffix: true })}
            {postData.author?.department && ` · ${postData.author.department}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {canSeePinTime && <span className="caption">{formatPinTimeLeft(pinData?.expiresAt)}</span>}
          <ReportActionMenu
            actions={isOwner ? [
              {
                key: 'pin',
                label: isPinned ? 'Unpin' : 'Pin',
                onClick: () => togglePin(),
                disabled: pinLoading || !canPin,
              },
              {
                key: 'edit',
                label: 'Edit',
                onClick: (event) => openEditPostModal(event),
                disabled: updatingPost,
              },
              {
                key: 'delete',
                label: 'Delete',
                danger: true,
                onClick: (event) => deletePost(event),
                disabled: deletingPost,
              },
            ] : []}
            onReport={!isOwner ? reportPost : undefined}
            entityLabel="post"
          />
        </div>
      </div>

      {postData.content && <p className="post-card__content">{postData.content}</p>}

      {postData.image && (
        <div className="post-card__image">
          <img src={postData.image} alt="Post" loading="lazy" />
        </div>
      )}

      <div className="post-card__actions">
        <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <svg width="16" height="16" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          {likeCount}
        </button>
        <button className="post-action-btn" onClick={handleComment}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {postData.commentCount ?? postData.comments?.length ?? 0}
        </button>
        <div className="post-action-btn" style={{ cursor: 'default' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
          {postData.views ?? 0}
        </div>
        <button className="post-action-btn" onClick={handleShare}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share
        </button>
      </div>
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Post"
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={updatingPost}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={submitPostEdit} disabled={updatingPost}>
              {updatingPost ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        )}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Post Content</label>
            <textarea
              className="form-textarea"
              rows={5}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Image</label>
            {editImagePreview ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <img src={editImagePreview} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10 }} />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEditImageFile(null)
                    setEditImagePreview('')
                    setRemoveEditImage(Boolean(postData.image))
                  }}
                >
                  Remove image
                </button>
              </div>
            ) : (
              <p className="caption" style={{ marginBottom: 8 }}>No image</p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setEditImageFile(file)
                setEditImagePreview(URL.createObjectURL(file))
                setRemoveEditImage(false)
                event.target.value = ''
              }}
            />
          </div>
        </div>
      </Modal>
    </article>
  )
}

export default ListingCard
