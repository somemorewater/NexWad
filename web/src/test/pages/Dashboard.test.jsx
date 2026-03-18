import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import Dashboard from '../../pages/Dashboard'
import { renderWithRouter } from '../test-utils'

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }))
vi.mock('../../components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }))
vi.mock('../../components/Modal', () => ({ default: ({ children }) => <div data-testid="modal">{children}</div> }))
vi.mock('../../components/Card', () => ({
  ListingCard: ({ listing }) => <div data-testid="listing-card">{listing.title}</div>,
}))

vi.mock('../../utils/pins', () => ({
  formatPinTimeLeft: () => '1h',
  runPaystackCharge: vi.fn(),
}))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockListingsAPI = vi.hoisted(() => ({ getMyListings: vi.fn() }))
const mockPinsAPI = vi.hoisted(() => ({ getMine: vi.fn(), extend: vi.fn(), unpin: vi.fn(), initialize: vi.fn(), initializeCredits: vi.fn() }))
const mockPostsAPI = vi.hoisted(() => ({ getMine: vi.fn() }))
vi.mock('../../api/endpoints', () => ({
  listingsAPI: mockListingsAPI,
  pinsAPI: mockPinsAPI,
  postsAPI: mockPostsAPI,
}))

describe('Dashboard', () => {
  it('renders seller dashboard metrics', async () => {
    mockUseAuth.mockReturnValue({ user: { _id: 's1', role: 'seller', subscription: { plan: 'seller_basic' } } })
    mockListingsAPI.getMyListings.mockResolvedValue({
      data: { listings: [{ _id: 'l1', title: 'Desk', status: 'active', price: 5000 }], usage: { remaining: 5 } },
    })
    mockPinsAPI.getMine.mockResolvedValue({
      data: { activePins: [], usage: { activeCount: 0, activeHoursRemaining: 0, credits: { balance: 2 } } },
    })
    mockPostsAPI.getMine.mockResolvedValue({ data: { posts: [] } })

    renderWithRouter(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Seller Dashboard')).toBeInTheDocument()
    })
  })
})
