import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import LostFound from '../../pages/LostFound'
import { renderWithRouter } from '../test-utils'

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }))
vi.mock('../../components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }))
vi.mock('../../components/Modal', () => ({ default: ({ children }) => <div data-testid="modal">{children}</div> }))
vi.mock('../../components/ReportActionMenu', () => ({ default: () => <div data-testid="report-menu" /> }))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockLostFoundAPI = vi.hoisted(() => ({ getAll: vi.fn() }))
const mockListingsAPI = vi.hoisted(() => ({ getPinned: vi.fn() }))
vi.mock('../../api/endpoints', () => ({
  lostFoundAPI: mockLostFoundAPI,
  listingsAPI: mockListingsAPI,
}))

describe('LostFound', () => {
  it('renders lost and found items', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    mockLostFoundAPI.getAll.mockResolvedValue({
      data: { items: [{ _id: 'lf1', title: 'Lost ID Card', type: 'lost', createdAt: new Date().toISOString(), reporter: { name: 'Alex' } }] },
    })
    mockListingsAPI.getPinned.mockResolvedValue({ data: { listings: [] } })

    renderWithRouter(<LostFound />)

    await waitFor(() => {
      expect(screen.getByText('Lost ID Card')).toBeInTheDocument()
    })
  })
})
