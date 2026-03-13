import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { chatAPI } from '../api/endpoints'
import { getBanInfo, clearBanInfo } from '../utils/banStore'

export default function Banned() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [supportChat, setSupportChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const banInfo = useMemo(() => getBanInfo() || {}, [])
  const banReason = user?.banReason || banInfo?.banReason
  const banMessage = banReason || banInfo?.error || 'Your account has been suspended.'

  const loadMessages = async (chatId) => {
    setLoadingMessages(true)
    try {
      const { data } = await chatAPI.getMessages(chatId, { page: 1, limit: 30 })
      setMessages(data.messages || [])
    } catch (err) {
      setError(err?.error || 'Could not load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  const openSupportChat = async () => {
    setLoadingChat(true)
    setError('')
    try {
      const { data } = await chatAPI.getSupportChat()
      setSupportChat(data.chat)
      await loadMessages(data.chat._id)
    } catch (err) {
      setError(err?.error || 'Could not open support chat')
    } finally {
      setLoadingChat(false)
    }
  }

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
    clearBanInfo()
    navigate('/login', { replace: true })
  }

  return (
    <div className="banned-page">
      <div className="banned-card">
        <div className="banned-header">
          <div className="banned-badge">Account Suspended</div>
          <h1>We need to review your account</h1>
          <p className="banned-sub">
            {banMessage}
          </p>
        </div>

        <div className="banned-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={openSupportChat}
            disabled={loadingChat}
          >
            {loadingChat ? 'Opening Support...' : 'Contact Customer Service'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div className="banned-chat">
          <div className="banned-chat__header">
            <div>
              <div className="banned-chat__title">Customer Service Chat</div>
              <div className="banned-chat__hint">
                {supportChat ? 'A support agent will respond shortly.' : 'Click the button above to start.'}
              </div>
            </div>
          </div>

          <div className="banned-chat__messages">
            {loadingMessages ? (
              <div className="banned-chat__empty">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="banned-chat__empty">No messages yet. Start the conversation.</div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender?._id === user?._id
                return (
                  <div key={msg._id} className={`banned-msg ${isMine ? 'banned-msg--mine' : 'banned-msg--theirs'}`}>
                    <div className="banned-msg__bubble">
                      {msg.text || 'Media sent'}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form className="banned-chat__input" onSubmit={handleSend}>
            <input
              type="text"
              className="banned-chat__field"
              placeholder="Write your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!supportChat || sending}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!supportChat || sending || !text.trim()}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>

          {error && <div className="banned-chat__error">{error}</div>}
        </div>
      </div>
    </div>
  )
}
