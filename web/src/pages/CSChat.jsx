import { useEffect, useState, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { chatAPI } from '../api/endpoints'
import toast from 'react-hot-toast'
import { SocketContext } from '../context/SocketContext'
import { useModal } from '../context/ModalContext'

export default function CSChat() {
  const { user } = useAuth()
  const { confirm } = useModal()
  const { emit, on, markSupportRead } = useContext(SocketContext)
  const navigate = useNavigate()
  const [supportChat, setSupportChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)

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

  useEffect(() => {
    let mounted = true
    const init = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await chatAPI.getSupportChat()
        if (!mounted) return
        setSupportChat(data.chat)
        const msgs = await chatAPI.getMessages(data.chat._id, { page: 1, limit: 30 })
        if (!mounted) return
        setMessages(msgs.data.messages || [])
      } catch (err) {
        if (!mounted) return
        setError(err?.error || 'Could not open support chat')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!supportChat?._id) return
    markSupportRead()
  }, [supportChat?._id, markSupportRead])

  useEffect(() => {
    if (!supportChat?._id) return
    emit('join_chat', { chatId: supportChat._id })
    return () => emit('leave_chat', { chatId: supportChat._id })
  }, [supportChat?._id, emit])

  useEffect(() => {
    if (!supportChat?._id) return
    const unsub = on('new_message', (msg) => {
      if (msg.chatId !== supportChat._id) return
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg])
    })
    return () => unsub?.()
  }, [on, supportChat?._id])

  const handleSend = async (e) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!supportChat || (!text.trim() && !file)) return
    setSending(true)
    setError('')
    try {
      const fd = new FormData()
      if (text.trim()) fd.append('text', text.trim())
      if (file) fd.append('media', file)
      const { data } = await chatAPI.sendMessage(supportChat._id, fd)
      setMessages(prev => prev.some(m => m._id === data.message?._id) ? prev : [...prev, data.message])
      setText('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError(err?.error || 'Could not send message')
    } finally {
      setSending(false)
    }
  }

  const handleEndChat = async () => {
    if (!supportChat?._id) return
    const confirmed = await confirm({
      title: 'End Support Chat',
      message: 'End this support chat? This will close the conversation for both sides.',
      confirmLabel: 'End Chat',
      cancelLabel: 'Cancel',
    })
    if (!confirmed) return
    try {
      await chatAPI.endSupportChat(supportChat._id)
      setSupportChat(null)
      setMessages([])
      toast.success('Chat closed')
    } catch (err) {
      setError(err?.error || 'Could not end chat')
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header-row" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="page-header" style={{ marginBottom: 0 }}>
              <h1 className="page-header__title">Customer Service</h1>
              <p className="page-header__sub">Chat with NexWAD support.</p>
            </div>
            <div className="cs-chat-actions">
              <button className="btn btn-ghost" onClick={() => navigate('/home')}>Back</button>
              <button className="btn btn-ghost" onClick={handleEndChat} disabled={!supportChat?._id}>End Chat</button>
            </div>
          </div>

          <div className="cs-chat-card">
            <div className="cs-chat-messages">
              {loading ? (
                <div className="cs-chat-empty">Loading chat...</div>
              ) : messages.length === 0 ? (
                <div className="cs-chat-empty">No messages yet. Start the conversation.</div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender?._id === user?._id
                  return (
                    <div key={msg._id} className={`cs-msg ${isMine ? 'cs-msg--mine' : 'cs-msg--theirs'}`}>
                      <div className="cs-msg__bubble">
                        {msg.media && (
                          <img
                            src={msg.media}
                            alt="Media"
                            style={{ maxWidth: 220, borderRadius: 10, display: 'block', cursor: 'pointer', marginBottom: msg.text ? 6 : 0 }}
                            onClick={() => window.open(msg.media, '_blank', 'noopener,noreferrer')}
                          />
                        )}
                        {msg.text || (msg.media ? '' : 'Media sent')}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <form className="cs-chat-input" onSubmit={handleSend}>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => fileRef.current?.click()}
                disabled={loading || sending}
                aria-label="Attach"
              >
                <AttachIcon />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
              />
              <input
                type="text"
                className="cs-chat-field"
                placeholder="Write your message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loading || sending}
              />
              <button
                type="submit"
                className="btn btn-primary btn-icon"
                disabled={loading || sending || (!text.trim() && !fileRef.current?.files?.[0])}
                aria-label="Send"
                style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)' }}
              >
                {sending ? <span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'white' }} /> : <SendIcon />}
              </button>
            </form>

            {error && <div className="cs-chat-error">{error}</div>}
          </div>
        </main>
      </div>
    </div>
  )
}
