import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { PostCard } from '../components/Card'
import { listingsAPI, postsAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import { rankFeed, deduplicateFeed } from '../utils/feedAlgorithm'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { formatPinTimeLeft } from '../utils/pins'

export default function Social() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [pinnedListings, setPinnedListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPinnedListing, setSelectedPinnedListing] = useState(null)
  const [newPost, setNewPost] = useState('')
  const [postImage, setPostImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsPost, setCommentsPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const fileRef = useRef(null)

  const loadFeed = async (reset = false) => {
    setLoading(true)
    try {
      const { data } = await postsAPI.getFeed({ page: reset ? 1 : page, limit: 20 })
      const received = Array.isArray(data?.posts) ? data.posts.length : 0
      const ranked = rankFeed(data.posts)
      let added = 0
      setPosts(prev => {
        const merged = reset ? ranked : [...prev, ...ranked]
        const deduped = deduplicateFeed(merged)
        added = reset ? deduped.length : deduped.length - prev.length
        return deduped
      })
      if (reset) {
        setPage(2)
        setHasMore(data.hasMore && received > 0)
      } else if (received > 0 && added > 0) {
        setPage(p => p + 1)
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      toast.error(err?.error || err?.message || 'Could not load feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFeed(true) }, [])

  useEffect(() => {
    listingsAPI.getPinned({ limit: 8 })
      .then(({ data }) => setPinnedListings(data?.listings || []))
      .catch(() => setPinnedListings([]))
  }, [])

  useEffect(() => {
    const postId = new URLSearchParams(location.search).get('post')
    if (!postId) return
    navigate(`/social/post/${encodeURIComponent(postId)}`, { replace: true })
  }, [location.search, navigate])

  const handleImagePick = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPostImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const submitPost = async () => {
    if (!isAuthenticated) {
      toast.error('Login required to create posts')
      return
    }
    if (!newPost.trim() && !postImage) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('content', newPost)
      if (postImage) fd.append('image', postImage)
      const { data } = await postsAPI.create(fd)
      setPosts(prev => [data.post, ...prev])
      setNewPost('')
      setPostImage(null)
      setImagePreview(null)
    } catch {
      toast.error('Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (postId, wasLiked) => {
    if (!isAuthenticated) {
      toast.error('Login required to like posts')
      throw new Error('Authentication required')
    }
    if (wasLiked) await postsAPI.unlike(postId)
    else await postsAPI.like(postId)
  }

  const openComments = async (postId) => {
    const post = posts.find(p => p._id === postId)
    if (!post) return
    setCommentsPost(post)
    setCommentsOpen(true)
    setComments([])
    setCommentsLoading(true)
    try {
      const { data } = await postsAPI.getComments(postId)
      setComments(data.comments || [])
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to load comments')
    } finally {
      setCommentsLoading(false)
    }
  }

  const submitComment = async () => {
    if (!isAuthenticated) {
      toast.error('Login required to comment')
      return
    }
    if (!commentsPost?._id || !commentText.trim()) return
    setCommentSubmitting(true)
    try {
      const { data } = await postsAPI.comment(commentsPost._id, commentText.trim())
      setComments(prev => [...prev, data.comment])
      setCommentText('')
      setPosts(prev => prev.map(p => (
        p._id === commentsPost._id
          ? { ...p, commentCount: data.commentCount }
          : p
      )))
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to post comment')
    } finally {
      setCommentSubmitting(false)
    }
  }

  const avatarInitials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 'var(--space-6)', color: 'var(--nw-ink)' }}>
              Campus Feed
            </h1>

            {/* Compose */}
            {isAuthenticated ? (
              <div className="card card-body" style={{ marginBottom: 'var(--space-5)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                  <div className="avatar avatar-md">{user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : avatarInitials}</div>
                  <div style={{ flex: 1 }}>
                    <textarea
                      className="form-textarea"
                      placeholder="What's happening on campus?"
                      value={newPost}
                      onChange={e => setNewPost(e.target.value)}
                      style={{ border: 'none', padding: 0, fontSize: '0.9375rem', resize: 'none', minHeight: 60, boxShadow: 'none' }}
                      rows={2}
                      onFocus={e => e.target.rows = 4}
                    />
                    {imagePreview && (
                      <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
                        <img src={imagePreview} alt="Preview" style={{ maxHeight: 200, borderRadius: 8, maxWidth: '100%' }} />
                        <button
                          onClick={() => { setPostImage(null); setImagePreview(null) }}
                          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                        ><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTop: '1px solid var(--nw-gray-100)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => fileRef.current?.click()}
                        >
                          <i className="fa-solid fa-camera" aria-hidden="true" /> Photo
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImagePick} />
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={submitPost}
                        disabled={submitting || (!newPost.trim() && !postImage)}
                      >
                        {submitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card card-body" style={{ marginBottom: 'var(--space-5)', color: 'var(--nw-gray-600)' }}>
                Browse public posts. Login to publish, like, and comment.
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
                      onClick={() => setSelectedPinnedListing(item)}
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

            {/* Feed */}
            {loading && posts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {posts.map((post, i) => (
                  <div key={post._id} className="animate-fade-in" style={{ animationDelay: `${(i % 10) * 0.05}s` }}>
                    {post._sponsored && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--nw-gray-400)', marginBottom: 4, paddingLeft: 2 }}>
                        Sponsored ·
                      </div>
                    )}
                    <PostCard
                      post={post}
                      onLike={handleLike}
                      onComment={openComments}
                      onUpdated={(updated) => setPosts((prev) => prev.map((entry) => (entry._id === updated._id ? { ...entry, ...updated } : entry)))}
                      onDeleted={(postId) => setPosts((prev) => prev.filter((entry) => entry._id !== postId))}
                    />
                  </div>
                ))}
                {hasMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
                    <button className="btn btn-secondary" onClick={() => loadFeed(false)} disabled={loading}>
                      {loading ? <span className="spinner" /> : 'Load more'}
                    </button>
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--nw-gray-400)', fontSize: '0.875rem', padding: 'var(--space-6)' }}>
                    <i className="fa-solid fa-circle-check" aria-hidden="true" /> You've seen everything
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

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
            <button
              className="btn btn-primary"
              onClick={() => {
                if (selectedPinnedListing?._id) navigate(`/marketplace/${selectedPinnedListing._id}`)
                setSelectedPinnedListing(null)
              }}
            >
              Open Listing
            </button>
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

      <Modal
        isOpen={commentsOpen}
        onClose={() => { setCommentsOpen(false); setCommentsPost(null); setCommentText('') }}
        title="Comments"
        size="md"
      >
        {commentsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {comments.length === 0 ? (
              <div style={{ color: 'var(--nw-gray-500)', fontSize: '0.9rem' }}>No comments yet.</div>
            ) : comments.map((c) => (
              <div key={c._id} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div className="avatar avatar-sm">
                  {c.author?.avatar
                    ? <img src={c.author.avatar} alt={c.author.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : (c.author?.name?.[0] || 'U')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.author?.name || 'User'}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--nw-gray-700)', marginTop: 2 }}>{c.text}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--nw-gray-400)', marginTop: 4 }}>
                    {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : 'Just now'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAuthenticated ? (
          <div style={{ borderTop: '1px solid var(--nw-gray-100)', marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Write a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={submitComment}
                disabled={commentSubmitting || !commentText.trim()}
                style={{ alignSelf: 'flex-end' }}
              >
                {commentSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--nw-gray-100)', marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', color: 'var(--nw-gray-600)', fontSize: '0.9rem' }}>
            Login to add a comment.
          </div>
        )}
      </Modal>
    </div>
  )
}
