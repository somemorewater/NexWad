import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import Subscription from '../../pages/Subscription'
import { renderWithRouter } from '../test-utils'

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }))
vi.mock('../../components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }))

vi.mock('../../utils/pins', () => ({
  runPaystackCharge: vi.fn(),
}))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockSubscriptionsAPI = vi.hoisted(() => ({
  getPlans: vi.fn(),
  getCurrent: vi.fn(),
  subscribe: vi.fn(),
  cancel: vi.fn(),
}))
vi.mock('../../api/endpoints', () => ({
  subscriptionsAPI: mockSubscriptionsAPI,
}))

describe('Subscription', () => {
  it('renders subscription plans', async () => {
    mockUseAuth.mockReturnValue({ user: { email: 'buyer@nexwad.com' } })
    mockSubscriptionsAPI.getPlans.mockResolvedValue({
      data: { plans: [{ _id: 'premium_buyer', name: 'Premium Buyer', price: 2000, durationDays: 30, features: ['Priority support'] }] },
    })
    mockSubscriptionsAPI.getCurrent.mockResolvedValue({ data: { subscription: null, application: null } })

    renderWithRouter(<Subscription />)

    await waitFor(() => {
      expect(screen.getByText('Premium Buyer')).toBeInTheDocument()
      expect(screen.getByText('Priority support')).toBeInTheDocument()
    })
  })
})
