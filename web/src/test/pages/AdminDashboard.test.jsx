import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor, render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminDashboard from '../../pages/AdminDashboard'

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }))
vi.mock('../../components/Modal', () => ({ default: ({ children }) => <div data-testid="modal">{children}</div> }))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockAdminAPI = vi.hoisted(() => ({
  getStats: vi.fn(),
  getUsers: vi.fn(),
  getSellerApplications: vi.fn(),
  getListings: vi.fn(),
  getReports: vi.fn(),
  getLogs: vi.fn(),
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  warnUser: vi.fn(),
  updateUserRole: vi.fn(),
}))
vi.mock('../../api/endpoints', () => ({
  adminAPI: mockAdminAPI,
}))

describe('AdminDashboard', () => {
  it('renders admin overview', async () => {
    mockUseAuth.mockReturnValue({ user: { name: 'Admin', role: 'admin' } })
    mockAdminAPI.getStats.mockResolvedValue({ data: { totalUsers: 10, totalListings: 2, totalPosts: 1, totalLostFound: 1, totalReports: 0, totalSales: 0 } })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Platform Overview')).toBeInTheDocument()
    })
  })
})
