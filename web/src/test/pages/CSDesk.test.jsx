import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import CSDesk from '../../pages/CSDesk'
import { renderWithRouter } from '../test-utils'
import { SocketContext } from '../../context/SocketContext'

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockChatAPI = vi.hoisted(() => ({
  getSupportInbox: vi.fn(),
  getMessages: vi.fn(),
  markRead: vi.fn(),
  sendMessage: vi.fn(),
  acceptSupportChat: vi.fn(),
  endSupportChat: vi.fn(),
}))
vi.mock('../../api/endpoints', () => ({
  chatAPI: mockChatAPI,
}))

describe('CSDesk', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { _id: 'cs1', name: 'Agent', role: 'cs' } })
    mockChatAPI.getSupportInbox.mockResolvedValue({
      data: {
        chats: [
          {
            _id: 'chat1',
            participants: [{ _id: 'cs1', name: 'Agent' }, { _id: 'u1', name: 'Alex' }],
            lastMessage: { text: 'Help', createdAt: new Date().toISOString() },
          },
        ],
      },
    })
    mockChatAPI.getMessages.mockResolvedValue({
      data: { messages: [] },
    })
    mockChatAPI.markRead.mockResolvedValue({})
  })

  it('renders support chats and allows accepting pending chat', async () => {
    mockChatAPI.acceptSupportChat.mockResolvedValue({
      data: {
        chat: {
          _id: 'chat1',
          participants: [{ _id: 'cs1', name: 'Agent' }, { _id: 'u1', name: 'Alex' }],
          supportAssignee: { _id: 'cs1', name: 'Agent' },
          lastMessage: { text: 'Help', createdAt: new Date().toISOString() },
        },
      },
    })

    const socketValue = { emit: vi.fn(), on: vi.fn(() => () => {}) }

    renderWithRouter(
      <SocketContext.Provider value={socketValue}>
        <CSDesk />
      </SocketContext.Provider>
    )

    expect(await screen.findByText('Customer Chats')).toBeInTheDocument()
    expect(await screen.findByText('Alex')).toBeInTheDocument()

    const acceptBtn = screen.getByRole('button', { name: /accept/i })
    fireEvent.click(acceptBtn)

    await waitFor(() => {
      expect(mockChatAPI.acceptSupportChat).toHaveBeenCalledWith('chat1')
    })
  })

  it('logs a complaint entry', async () => {
    const socketValue = { emit: vi.fn(), on: vi.fn(() => () => {}) }

    renderWithRouter(
      <SocketContext.Provider value={socketValue}>
        <CSDesk />
      </SocketContext.Provider>
    )

    expect(await screen.findByText('Complaint Log')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Customer name'), { target: { value: 'Alex' } })
    fireEvent.change(screen.getByPlaceholderText('Write a quick summary of the complaint...'), { target: { value: 'Payment dispute' } })

    fireEvent.click(screen.getByRole('button', { name: /log complaint/i }))

    await waitFor(() => {
      expect(screen.getByText(/Order issue.*Payment dispute/i)).toBeInTheDocument()
    })
  })
})
