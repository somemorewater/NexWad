import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { PostCard } from '../components/Card'
import { postsAPI } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'

export default function PostDetails() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const commentsRef = useRef(null)
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  useEffect(() => {
    if (!postId) return
    setLoading(true)
    postsAPI.getById(postId)
      .then(({ data }) => {
        setPost(data.post || null)
      })
      .catch((err) => {
        toast.error(err?.error || err?.message || 'Could not load post')
        setPost(null)
      })
      .finally(() => setLoading(false))
  }, [postId])

  useEffect(() => {
    if (!postId) return
    setCommentsLoading(true)
    postsAPI.getComments(postId)
      .then(({ data }) => setComments(data.comments || []))
      .catch((err) => {
        toast.error(err?.error || err?.message || 'Could not load comments')
        setComments([])
      })
      .finally(() => setCommentsLoading(false))
  }, [postId])

  const handleLike = async (targetPostId, wasLiked) => {
    if (!isAuthenticated) {
      toast.error('Login required to like posts')
      throw new Error('Authentication required')
    }
    if (wasLiked) await postsAPI.unlike(targetPostId)
    else await postsAPI.like(targetPostId)
  }

  const focusComments = async () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const submitComment = async () => {
    if (!isAuthenticated) {
      toast.error('Login required to comment')
      return
    }
    if (!postId || !commentText.trim()) return

    setCommentSubmitting(true)
    try {
      const { data } = await postsAPI.comment(postId, commentText.trim())
      setComments((prev) => [...prev, data.comment])
      setCommentText('')
      setPost((prev) => (
        prev
          ? { ...prev, commentCount: data.commentCount }
          : prev
      ))
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to post comment')
    } finally {
      setCommentSubmitting(false)
    }
  }

  const commentsCount = useMemo(
    () => post?.commentCount ?? comments.length ?? 0,
    [post?.commentCount, comments.length]
  )

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div style={{ maxWidth: 740, margin: '0 auto', display: 'grid', gap: 'var(--space-4)' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/social')} style={{ justifySelf: 'flex-start' }}>
              <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to feed
            </button>

            {loading ? (
              <div className="card card-body">Loading post...</div>
            ) : !post ? (
              <div className="empty-state">
                <div className="empty-state__title">Post not found</div>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/social')}>Go to Feed</button>
              </div>
            ) : (
              <>
                <PostCard post={post} onLike={handleLike} onComment={focusComments} />
                <section ref={commentsRef} className="card card-body">
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 'var(--space-3)' }}>
                    Comments ({commentsCount})
                  </h2>

                  {commentsLoading ? (
                    <div style={{ padding: 'var(--space-4)' }}><div className="spinner" /></div>
                  ) : comments.length === 0 ? (
                    <div className="caption">No comments yet.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                      {comments.map((comment) => (
                        <div key={comment._id} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                          <div className="avatar avatar-sm">
                            {comment.author?.avatar
                              ? <img src={comment.author.avatar} alt={comment.author?.name || 'User'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                              : (comment.author?.name?.[0] || 'U')}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{comment.author?.name || 'User'}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--nw-gray-700)' }}>{comment.text}</div>
                            <div className="caption" style={{ marginTop: 4 }}>
                              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'Just now'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isAuthenticated ? (
                    <div style={{ borderTop: '1px solid var(--nw-gray-100)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(event) => setCommentText(event.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={submitComment}
                          disabled={commentSubmitting || !commentText.trim()}
                        >
                          {commentSubmitting ? 'Posting...' : 'Post comment'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--nw-gray-100)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)' }} className="caption">
                      Login to join the conversation.
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
