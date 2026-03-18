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
    mockAdminAPI.getStats.mockResolvedValue({
      data: {
        totalUsers: 10,
        activeListings: 2,
        totalRevenue: 0,
        openReports: 0,
        premiumUsers: 1,
        activeLostFound: 1,
        currentActiveUsers: 3,
        dailyActiveUsers: 6,
        totalPosts: 12,
        postsToday: 2,
        avgListingsPerDay: 1.2,
        planBreakdown: { basic: 8, premium: 2 },
        postsDailySeries: [{ date: '2026-03-12', count: 1 }],
        listingsDailySeries: [{ date: '2026-03-12', count: 1 }],
        performanceSummary: {
          windowHours: 24,
          totalRequests: 100,
          avgDurationMs: 120,
          p95DurationMs: 240,
          p99DurationMs: 400,
          errorRate: 0.02,
          slowestRoutes: [{ route: '/api/posts', method: 'GET', avgDurationMs: 220, count: 12 }],
        },
        performanceDailySeries: [{ date: '2026-03-12', avgDurationMs: 120, errorRate: 0.01 }],
        recentUsers: [],
      },
    })

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
