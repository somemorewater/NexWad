import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import CSChat from '../../pages/CSChat'
import { renderWithRouter } from '../test-utils'
import { SocketContext } from '../../context/SocketContext'

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }))
vi.mock('../../components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockChatAPI = vi.hoisted(() => ({
  getSupportChat: vi.fn(),
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
  endSupportChat: vi.fn(),
}))
vi.mock('../../api/endpoints', () => ({
  chatAPI: mockChatAPI,
}))

describe('CSChat', () => {
  it('loads support chat and sends a message', async () => {
    mockUseAuth.mockReturnValue({ user: { _id: 'u1', name: 'User' } })
    mockChatAPI.getSupportChat.mockResolvedValue({ data: { chat: { _id: 'chat1' } } })
    mockChatAPI.getMessages.mockResolvedValue({
      data: { messages: [{ _id: 'm1', sender: { _id: 'u2' }, text: 'Hello' }] },
    })
    mockChatAPI.sendMessage.mockResolvedValue({ data: { message: { _id: 'm2', text: 'Hi' } } })

    const socketValue = { emit: vi.fn(), on: vi.fn(() => () => {}), markSupportRead: vi.fn() }

    renderWithRouter(
      <SocketContext.Provider value={socketValue}>
        <CSChat />
      </SocketContext.Provider>
    )

    expect(await screen.findByText('Customer Service')).toBeInTheDocument()
    expect(await screen.findByText('Hello')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Write your message...')
    fireEvent.change(input, { target: { value: 'Hi' } })

    fireEvent.submit(input.closest('form'))

    await waitFor(() => {
      expect(mockChatAPI.sendMessage).toHaveBeenCalled()
    })
  })
})
