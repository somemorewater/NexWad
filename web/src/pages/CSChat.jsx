import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { chatAPI } from '../api/endpoints'

export default function CSChat() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [supportChat, setSupportChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

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

  const handleSend = async (e) => {
    e.preventDefault()
    if (!supportChat || !text.trim()) return
    setSending(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('text', text.trim())
      const { data } = await chatAPI.sendMessage(supportChat._id, fd)
      setMessages(prev => [...prev, data.message])
      setText('')
    } catch (err) {
      setError(err?.error || 'Could not send message')
    } finally {
      setSending(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
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
              <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
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
                        {msg.text || 'Media sent'}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <form className="cs-chat-input" onSubmit={handleSend}>
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
                className="btn btn-primary"
                disabled={loading || sending || !text.trim()}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>

            {error && <div className="cs-chat-error">{error}</div>}
          </div>
        </main>
      </div>
    </div>
  )
}
