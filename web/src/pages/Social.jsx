import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { PostCard } from '../components/Card'
import { postsAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import { rankFeed, deduplicateFeed } from '../utils/feedAlgorithm'
import toast from 'react-hot-toast'

export default function Social() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [postImage, setPostImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const fileRef = useRef(null)

  const loadFeed = async (reset = false) => {
    setLoading(true)
    try {
      const { data } = await postsAPI.getFeed({ page: reset ? 1 : page, limit: 20 })
      const ranked = rankFeed(data.posts)
      setPosts(prev => deduplicateFeed(reset ? ranked : [...prev, ...ranked]))
      setHasMore(data.hasMore)
      if (!reset) setPage(p => p + 1)
      else setPage(2)
    } catch {
      toast.error('Could not load feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFeed(true) }, [])

  const handleImagePick = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPostImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const submitPost = async () => {
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
    if (wasLiked) await postsAPI.unlike(postId)
    else await postsAPI.like(postId)
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
                    <PostCard post={post} onLike={handleLike} />
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
    </div>
  )
}
