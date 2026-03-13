import { useState, useEffect, useRef, useContext, useCallback } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../hooks/useAuth'
import { chatAPI } from '../api/endpoints'
import { SocketContext } from '../context/SocketContext'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

function SendIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function AttachIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

const DEFAULT_COMPLAINTS = [
  {
    id: 'cmp-1',
    customer: 'Hauwa Musa',
    issue: 'Late delivery',
    summary: 'Package delivered after 5 days. Asked for refund.',
    priority: 'high',
    status: 'open',
    createdAt: '2026-03-11T10:20:00Z',
    channel: 'Chat',
  },
  {
    id: 'cmp-2',
    customer: 'Eze Chima',
    issue: 'Payment dispute',
    summary: 'Buyer claims double charge for subscription renewal.',
    priority: 'medium',
    status: 'investigating',
    createdAt: '2026-03-12T14:05:00Z',
    channel: 'Email',
  },
]

export default function CSDesk() {
  const { user } = useAuth()
  const { emit, on } = useContext(SocketContext)
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const fileRef = useRef(null)

  const [complaints, setComplaints] = useState(DEFAULT_COMPLAINTS)
  const [complaintForm, setComplaintForm] = useState({
    customer: '',
    issue: 'Order issue',
    priority: 'medium',
    summary: '',
    channel: 'Chat',
  })

  const appendMessage = useCallback((msg) => {
    setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg])
  }, [])

  const loadChats = useCallback(async () => {
    try {
      const { data } = await chatAPI.getChats()
      setChats(data.chats || [])
      if (!activeChatId && data.chats?.length) setActiveChatId(data.chats[0]._id)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [activeChatId])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  useEffect(() => {
    if (!activeChatId) return
    setMessages([])
    chatAPI.getMessages(activeChatId, { page: 1, limit: 30 })
      .then(({ data }) => {
        setMessages(data.messages)
        chatAPI.markRead(activeChatId).catch(() => {})
      })
      .catch(() => toast.error('Failed to load messages'))
  }, [activeChatId])

  useEffect(() => {
    if (!activeChatId) return
    emit('join_chat', { chatId: activeChatId })
    return () => emit('leave_chat', { chatId: activeChatId })
  }, [activeChatId, emit])

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
      if (msg.chatId === activeChatId) appendMessage(msg)
    })
    return () => unsub?.()
  }, [on, activeChatId, loadChats, appendMessage])

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
  const activeCustomer = activeChat?.participants?.find(p => p._id !== user?._id)

  useEffect(() => {
    setComplaintForm(prev => ({
      ...prev,
      customer: prev.customer || activeCustomer?.name || '',
      channel: activeChat ? 'Chat' : prev.channel,
    }))
  }, [activeCustomer?.name, activeChat])

  const handleComplaintChange = (field, value) => {
    setComplaintForm(prev => ({ ...prev, [field]: value }))
  }

  const handleLogComplaint = (e) => {
    e.preventDefault()
    if (!complaintForm.customer || !complaintForm.summary.trim()) {
      toast.error('Add customer name and summary')
      return
    }
    const entry = {
      id: `cmp-${Date.now()}`,
      customer: complaintForm.customer,
      issue: complaintForm.issue,
      summary: complaintForm.summary,
      priority: complaintForm.priority,
      status: 'open',
      channel: complaintForm.channel,
      createdAt: new Date().toISOString(),
    }
    setComplaints(prev => [entry, ...prev])
    setComplaintForm(prev => ({
      ...prev,
      summary: '',
    }))
    toast.success('Complaint logged')
  }

  const updateComplaintStatus = (id, status) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  return (
    <div>
      <Navbar />
      <div className="cs-layout">
        <div className="chat-list">
          <div className="chat-list__header">
            <div className="chat-list__title">Customer Chats</div>
            <div className="cs-subtitle">Assigned to {user?.name || 'CS Agent'}</div>
          </div>
          {loading ? (
            <div style={{ padding: 16 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12, marginBottom: 8 }} />)}
            </div>
          ) : chats.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--nw-gray-400)', fontSize: '0.875rem' }}>
              No active conversations yet.
            </div>
          ) : (
            chats.map(chat => {
              const other = chat.participants?.find(p => p._id !== user?._id)
              return (
                <div
                  key={chat._id}
                  className={`chat-item ${activeChatId === chat._id ? 'active' : ''}`}
                  onClick={() => setActiveChatId(chat._id)}
                >
                  <div className="avatar avatar-md">
                    {other?.avatar
                      ? <img src={other.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : other?.name?.[0]}
                  </div>
                  <div className="chat-item__info">
                    <div className="chat-item__name">{other?.name || 'Customer'}</div>
                    <div className="chat-item__preview">
                      {chat.lastMessage?.text || chat.lastMessage?.media
                        ? <><i className="fa-solid fa-paperclip" aria-hidden="true" /> Media</>
                        : 'No messages yet'}
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

        <div className="chat-window">
          {!activeChatId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: 'var(--nw-gray-400)' }}>
              <div style={{ fontSize: '3rem' }}><i className="fa-solid fa-headset" aria-hidden="true" /></div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--nw-gray-500)' }}>Select a customer</div>
              <div style={{ fontSize: '0.875rem' }}>Pick a chat to start helping.</div>
            </div>
          ) : (
            <>
              <div className="chat-window__header">
                <div className="avatar avatar-md">
                  {activeCustomer?.avatar
                    ? <img src={activeCustomer.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : activeCustomer?.name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{activeCustomer?.name || 'Customer'}</div>
                  <div className="cs-subtitle">Live support chat</div>
                </div>
              </div>

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

              <div className="chat-window__input">
                <button className="btn btn-ghost btn-icon" onClick={() => fileRef.current?.click()} aria-label="Attach">
                  <AttachIcon />
                </button>
                <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={(e) => sendMessage(input, e.target.files[0])} />
                <textarea
                  className="chat-input-field"
                  placeholder="Type a response…"
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

        <aside className="cs-complaints">
          <div className="cs-panel-header">
            <div>
              <div className="cs-panel-title">Complaint Log</div>
              <div className="cs-subtitle">Track and resolve customer issues fast.</div>
            </div>
            <div className="badge badge-primary">{complaints.length} open</div>
          </div>
          <div className="cs-panel-body">
            <form className="cs-complaint-form" onSubmit={handleLogComplaint}>
              <div>
                <label className="form-label">Customer Name</label>
                <div className="cs-customer-input">
                  <input
                    className="form-input"
                    value={complaintForm.customer}
                    onChange={e => handleComplaintChange('customer', e.target.value)}
                    placeholder="Customer name"
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => handleComplaintChange('customer', activeCustomer?.name || '')}
                    disabled={!activeCustomer?.name}
                  >
                    Use active chat
                  </button>
                </div>
                <span className="form-hint">Required to log a complaint.</span>
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">Issue Type</label>
                  <select
                    className="form-input"
                    value={complaintForm.issue}
                    onChange={e => handleComplaintChange('issue', e.target.value)}
                  >
                    {['Order issue', 'Payment dispute', 'Account access', 'Product quality', 'Delivery delay', 'Other'].map(issue => (
                      <option key={issue} value={issue}>{issue}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input"
                    value={complaintForm.priority}
                    onChange={e => handleComplaintChange('priority', e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Channel</label>
                  <select
                    className="form-input"
                    value={complaintForm.channel}
                    onChange={e => handleComplaintChange('channel', e.target.value)}
                  >
                    <option value="Chat">Chat</option>
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Summary</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={complaintForm.summary}
                  onChange={e => handleComplaintChange('summary', e.target.value)}
                  placeholder="Write a quick summary of the complaint..."
                />
              </div>
              <button className="btn btn-primary" type="submit">Log Complaint</button>
            </form>

            <div className="cs-section-title">Recent Complaints</div>
            <div className="cs-complaint-list">
              {complaints.map(item => (
                <div key={item.id} className="cs-complaint-item">
                  <div>
                    <div className="cs-complaint-title">{item.customer}</div>
                    <div className="cs-complaint-summary">{item.issue} • {item.summary}</div>
                    <div className="cs-complaint-meta">
                      {format(new Date(item.createdAt), 'MMM d, yyyy')} · {item.channel}
                    </div>
                  </div>
                  <div className="cs-complaint-actions">
                    <span className={`badge badge-${item.priority === 'urgent' ? 'red' : item.priority === 'high' ? 'gold' : 'accent'}`}>{item.priority}</span>
                    <select
                      className="cs-complaint-select"
                      value={item.status}
                      onChange={e => updateComplaintStatus(item.id, e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
