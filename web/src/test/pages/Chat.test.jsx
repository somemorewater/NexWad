import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import Chat from '../../pages/Chat'
import { renderWithRouter } from '../test-utils'
import { SocketContext } from '../../context/SocketContext'

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockChatAPI = vi.hoisted(() => ({
  getChats: vi.fn(),
  getMessages: vi.fn(),
  markRead: vi.fn(),
  sendMessage: vi.fn(),
  deleteChat: vi.fn(),
  getOrCreate: vi.fn(),
}))
vi.mock('../../api/endpoints', () => ({
  chatAPI: mockChatAPI,
}))

describe('Chat', () => {
  it('renders chat list and loads messages', async () => {
    mockUseAuth.mockReturnValue({ user: { _id: 'u1', role: 'buyer' } })
    mockChatAPI.getChats.mockResolvedValue({
      data: {
        chats: [
          {
            _id: 'c1',
            participants: [{ _id: 'u1', name: 'Me' }, { _id: 'u2', name: 'Sam' }],
            lastMessage: { text: 'Hi', createdAt: new Date().toISOString() },
          },
        ],
      },
    })
    mockChatAPI.getMessages.mockResolvedValue({ data: { messages: [{ _id: 'm1', text: 'Hi', createdAt: new Date().toISOString() }], hasMore: false } })
    mockChatAPI.markRead.mockResolvedValue({})

    const socketValue = { emit: vi.fn(), on: vi.fn(() => () => {}) }

    renderWithRouter(
      <SocketContext.Provider value={socketValue}>
        <Chat />
      </SocketContext.Provider>
    )

    expect(await screen.findByText('Sam')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Sam'))

    await waitFor(() => {
      expect(mockChatAPI.getMessages).toHaveBeenCalledWith('c1', { page: 1, limit: 30 })
    })
  })
})
