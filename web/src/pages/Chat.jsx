import { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { SocketContext } from '../context/SocketContext'
import { useAuth } from '../hooks/useAuth'
import { chatAPI } from '../api/endpoints'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

function SendIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
}

function AttachIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
}

export default function Chat() {
  const { chatId: paramChatId } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { emit, on } = useContext(SocketContext)
  const navigate = useNavigate()

  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(paramChatId || null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const messagesEndRef = useRef(null)
  const fileRef = useRef(null)
  const handledQueryStartRef = useRef(false)
  const appendMessage = useCallback((msg) => {
    setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg])
  }, [])

  const loadChats = useCallback(async () => {
    try {
      const { data } = await chatAPI.getChats()
      setChats(data.chats || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  // Load chat list
  useEffect(() => {
    loadChats()
  }, [loadChats])

  // Start chat from query params if present (e.g. /chat?seller=<id>&listing=<id>)
  useEffect(() => {
    if (handledQueryStartRef.current) return
    if (paramChatId) return
    const sellerId = searchParams.get('seller')
    if (!sellerId) return
    handledQueryStartRef.current = true

    const listingId = searchParams.get('listing')
    chatAPI.getOrCreate(listingId || null, sellerId)
      .then(({ data }) => {
        setActiveChatId(data.chat._id)
        navigate(`/chat/${data.chat._id}`, { replace: true })
      })
      .catch((err) => {
        toast.error(err?.error || err?.message || 'Could not open chat')
      })
  }, [paramChatId, searchParams, navigate])

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChatId) return
    setMessages([])
    setPage(1)
    setHasMoreMessages(true)
    chatAPI.getMessages(activeChatId, { page: 1, limit: 30 })
      .then(({ data }) => {
        setMessages(data.messages) // oldest first
        setHasMoreMessages(data.hasMore)
        chatAPI.markRead(activeChatId).catch(() => {})
      })
      .catch(() => toast.error('Failed to load messages'))
  }, [activeChatId])

  // Socket: join/leave active room
  useEffect(() => {
    if (!activeChatId) return
    emit('join_chat', { chatId: activeChatId })

    return () => {
      emit('leave_chat', { chatId: activeChatId })
    }
  }, [activeChatId, emit])

  // Socket: listen for new messages globally
  useEffect(() => {
    const unsub = on('new_message', (msg) => {
      let chatExists = false
      setChats(prev => {
        chatExists = prev.some(c => c._id === msg.chatId)
        if (!chatExists) return prev
        if (msg.chatId === activeChatId) {
          return prev.map(c => c._id === activeChatId ? { ...c, lastMessage: msg, unreadCount: 0 } : c)
        }
        return prev.map(c => c._id === msg.chatId ? { ...c, lastMessage: msg, unreadCount: (c.unreadCount || 0) + 1 } : c)
      })

      if (!chatExists) loadChats()

      if (msg.chatId === activeChatId) {
        appendMessage(msg)
      }
    })
    return () => unsub?.()
  }, [on, activeChatId, loadChats, appendMessage])

  // Auto-scroll
  useEffect(() => {
    if (messages.length) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text, file) => {
    if (!text.trim() && !file) return
    if (!activeChatId) return
    setSending(true)
    try {
      const fd = new FormData()
      if (text.trim()) fd.append('text', text.trim())
      if (file) fd.append('media', file)
      const { data } = await chatAPI.sendMessage(activeChatId, fd)
      appendMessage(data.message)
      setInput('')
      // Update chat list preview
      setChats(prev => prev.map(c => c._id === activeChatId ? { ...c, lastMessage: data.message } : c))
    } catch {
      toast.error('Failed to send')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const activeChat = chats.find(c => c._id === activeChatId)

  const totalUnread = chats.reduce((s, c) => s + (c.unreadCount || 0), 0)

  return (
    <div>
      <Navbar />
      <div className="chat-layout">
        {/* Chat List */}
        <div className="chat-list">
          <div className="chat-list__header">
            <div className="chat-list__title">Messages {totalUnread > 0 && <span className="badge badge-primary" style={{ marginLeft: 8 }}>{totalUnread}</span>}</div>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--nw-gray-400)', pointerEvents: 'none' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Search messages" style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--nw-gray-200)', fontSize: '0.875rem', outline: 'none' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 16 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12, marginBottom: 8 }} />)}
            </div>
          ) : chats.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--nw-gray-400)', fontSize: '0.875rem' }}>
              No conversations yet.<br />Start chatting with a seller!
            </div>
          ) : (
            chats.map(chat => {
              const other = chat.participants?.find(p => p._id !== user?._id)
              return (
                <div
                  key={chat._id}
                  className={`chat-item ${activeChatId === chat._id ? 'active' : ''}`}
                  onClick={() => { setActiveChatId(chat._id); navigate(`/chat/${chat._id}`) }}
                >
                  <div className="avatar avatar-md">
                    {other?.avatar ? <img src={other.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : other?.name?.[0]}
                  </div>
                  <div className="chat-item__info">
                    <div className="chat-item__name">{other?.name}</div>
                    <div className="chat-item__preview">
                      {chat.lastMessage?.text || chat.lastMessage?.media ? <><i className="fa-solid fa-paperclip" aria-hidden="true" /> Media</> : 'No messages yet'}
                    </div>
                  </div>
                  <div className="chat-item__meta">
                    <span className="chat-item__time">
                      {chat.lastMessage?.createdAt
                        ? formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: false }).replace('about ', '')
                        : ''}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="chat-item__unread">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          {!activeChatId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: 'var(--nw-gray-400)' }}>
              <div style={{ fontSize: '3rem' }}><i className="fa-solid fa-comments" aria-hidden="true" /></div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--nw-gray-500)' }}>Select a conversation</div>
              <div style={{ fontSize: '0.875rem' }}>Or contact a seller from the Marketplace</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="chat-window__header">
                {(() => {
                  const other = activeChat?.participants?.find(p => p._id !== user?._id)
                  return (
                    <>
                      <div className="avatar avatar-md">{other?.avatar ? <img src={other.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : other?.name?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{other?.name}</div>
                        {activeChat?.listing && (
                          <div className="chat-window__listing">Re: {activeChat.listing.title}</div>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>

              {activeChat?.listing && (
                <div style={{
                  margin: '10px 16px 0',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--nw-gray-100)',
                  background: 'var(--nw-gray-50)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>
                    {activeChat.listing.title}
                    {activeChat.listing.price ? ` - N${activeChat.listing.price.toLocaleString()}` : ''}
                  </div>
                  {activeChat.listing.description && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--nw-gray-500)' }}>
                      {activeChat.listing.description.length > 120
                        ? `${activeChat.listing.description.slice(0, 120)}...`
                        : activeChat.listing.description}
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="chat-window__messages">
                {messages.map((msg, i) => {
                  const isMine = msg.sender === user?._id || msg.sender?._id === user?._id
                  const showDate = i === 0 || new Date(messages[i-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString()
                  return (
                    <div key={msg._id || i}>
                      {showDate && (
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--nw-gray-400)', margin: '8px 0' }}>
                          {format(new Date(msg.createdAt), 'MMMM d, yyyy')}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                        <div className={`chat-bubble chat-bubble--${isMine ? 'sent' : 'received'}`}>
                          {msg.media && <img src={msg.media} alt="Media" style={{ maxWidth: 200, borderRadius: 8, marginBottom: 4, display: 'block' }} />}
                          {msg.text}
                          <time className="chat-bubble__time">{format(new Date(msg.createdAt), 'HH:mm')}</time>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chat-window__input">
                <button className="btn btn-ghost btn-icon" onClick={() => fileRef.current?.click()} aria-label="Attach">
                  <AttachIcon />
                </button>
                <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={(e) => sendMessage(input, e.target.files[0])} />
                <textarea
                  className="chat-input-field"
                  placeholder="Type a message…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  className="btn btn-primary btn-icon"
                  onClick={() => sendMessage(input)}
                  disabled={sending || !input.trim()}
                  aria-label="Send"
                  style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)' }}
                >
                  {sending ? <span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'white' }} /> : <SendIcon />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
