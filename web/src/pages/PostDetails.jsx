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
  const { isAuthenticated, user } = useAuth()
  const commentsRef = useRef(null)
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [replyTargetId, setReplyTargetId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [commentActionId, setCommentActionId] = useState(null)

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
      .then(({ data }) => {
        const list = Array.isArray(data.comments) ? data.comments : []
        const normalized = list.map((c) => ({
          ...c,
          likes: Array.isArray(c.likes) ? c.likes : [],
          replies: Array.isArray(c.replies) ? c.replies : [],
          shares: c.shares || 0,
          views: c.views || 0,
        }))
        setComments(normalized)
      })
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

  const isCommentLikedByMe = (comment) => {
    const userId = user?._id
    if (!userId) return false
    return (comment.likes || []).some((id) => (id?._id || id).toString?.() === userId)
  }

  const toggleCommentLike = async (commentId) => {
    if (!isAuthenticated) {
      toast.error('Login required to like comments')
      return
    }
    setCommentActionId(`like-${commentId}`)
    const target = comments.find(c => c._id === commentId)
    const liked = target ? isCommentLikedByMe(target) : false
    try {
      if (liked) await postsAPI.unlikeComment(postId, commentId)
      else await postsAPI.likeComment(postId, commentId)
      setComments(prev => prev.map(c => {
        if (c._id !== commentId) return c
        const likes = liked
          ? (c.likes || []).filter(id => (id?._id || id).toString?.() !== user?._id)
          : [...(c.likes || []), user?._id].filter(Boolean)
        return { ...c, likes }
      }))
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to update like')
    } finally {
      setCommentActionId(null)
    }
  }

  const shareComment = async (commentId) => {
    const url = `${window.location.origin}/social/post/${postId}?comment=${commentId}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Comment on NexWAD', url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied')
      }
      await postsAPI.shareComment(postId, commentId)
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, shares: (c.shares || 0) + 1 } : c))
    } catch (err) {
      if (err?.message !== 'Share canceled') toast.error(err?.error || err?.message || 'Failed to share')
    }
  }

  const submitReply = async (commentId) => {
    if (!isAuthenticated) {
      toast.error('Login required to comment')
      return
    }
    const text = String(replyText || '').trim()
    if (!text) return
    setCommentActionId(`reply-${commentId}`)
    try {
      const { data } = await postsAPI.replyComment(postId, commentId, text)
      setComments(prev => prev.map(c => c._id === commentId
        ? { ...c, replies: [...(c.replies || []), data.reply] }
        : c
      ))
      setReplyText('')
      setReplyTargetId(null)
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to reply')
    } finally {
      setCommentActionId(null)
    }
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
                <PostCard
                  post={post}
                  onLike={handleLike}
                  onComment={focusComments}
                  onUpdated={(updated) => setPost((prev) => ({ ...prev, ...updated }))}
                  onDeleted={() => {
                    toast.success('Post deleted')
                    navigate('/social')
                  }}
                />
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
                            <div className="comment-actions">
                              <button
                                className={`comment-action-btn ${isCommentLikedByMe(comment) ? 'liked' : ''}`}
                                onClick={() => toggleCommentLike(comment._id)}
                                disabled={commentActionId === `like-${comment._id}`}
                              >
                                <i className="fa-solid fa-heart" aria-hidden="true" />
                                {comment.likes?.length || 0}
                              </button>
                              <button
                                className="comment-action-btn"
                                onClick={() => setReplyTargetId(replyTargetId === comment._id ? null : comment._id)}
                              >
                                <i className="fa-regular fa-comment-dots" aria-hidden="true" />
                                {comment.replies?.length || 0}
                              </button>
                              <div className="comment-action-btn comment-action-btn--static">
                                <i className="fa-regular fa-eye" aria-hidden="true" />
                                {comment.views || 0}
                              </div>
                              <button className="comment-action-btn" onClick={() => shareComment(comment._id)}>
                                <i className="fa-solid fa-share" aria-hidden="true" />
                                {comment.shares || 0}
                              </button>
                            </div>

                            {comment.replies?.length > 0 && (
                              <div className="comment-replies">
                                {comment.replies.map((r) => (
                                  <div key={r._id} className="comment-reply">
                                    <div className="avatar avatar-xs">
                                      {r.author?.avatar
                                        ? <img src={r.author.avatar} alt={r.author?.name || 'User'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                        : (r.author?.name?.[0] || 'U')}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.author?.name || 'User'}</div>
                                      <div style={{ fontSize: '0.85rem', color: 'var(--nw-gray-700)' }}>{r.text}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {replyTargetId === comment._id && (
                              <div className="comment-reply-box">
                                <textarea
                                  className="form-textarea"
                                  rows={2}
                                  placeholder="Write a reply..."
                                  value={replyText}
                                  onChange={(event) => setReplyText(event.target.value)}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => submitReply(comment._id)}
                                    disabled={commentActionId === `reply-${comment._id}` || !replyText.trim()}
                                  >
                                    {commentActionId === `reply-${comment._id}` ? 'Replying...' : 'Reply'}
                                  </button>
                                </div>
                              </div>
                            )}
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
