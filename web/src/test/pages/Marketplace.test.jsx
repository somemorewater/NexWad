import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import Marketplace from '../../pages/Marketplace'
import { renderWithRouter } from '../test-utils'

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }))
vi.mock('../../components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }))
vi.mock('../../components/Modal', () => ({ default: ({ children }) => <div data-testid="modal">{children}</div> }))
vi.mock('../../components/Card', () => ({
  ListingCard: ({ listing }) => <div data-testid="listing-card">{listing.title}</div>,
}))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockListingsAPI = vi.hoisted(() => ({
  getAll: vi.fn(),
  getPinned: vi.fn(),
}))
const mockChatAPI = vi.hoisted(() => ({
  getOrCreate: vi.fn(),
}))
vi.mock('../../api/endpoints', () => ({
  listingsAPI: mockListingsAPI,
  chatAPI: mockChatAPI,
}))

describe('Marketplace', () => {
  it('renders listings from API', async () => {
    mockUseAuth.mockReturnValue({ user: { _id: 'u1', role: 'buyer' }, isAuthenticated: true })
    mockListingsAPI.getAll.mockResolvedValue({
      data: {
        listings: [{ _id: 'l1', title: 'Laptop', seller: { _id: 's1' } }],
        hasMore: false,
      },
    })
    mockListingsAPI.getPinned.mockResolvedValue({ data: { listings: [] } })

    renderWithRouter(<Marketplace />)

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument()
    })
  })
})
