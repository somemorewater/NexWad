import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import FeatureGuide from '../../pages/FeatureGuide'
import { renderWithRouter } from '../test-utils'

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }))
vi.mock('../../components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('FeatureGuide', () => {
  it('shows buyer features and support chat', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'Buyer', role: 'buyer', subscription: { plan: 'basic' } },
    })

    renderWithRouter(<FeatureGuide />)

    expect(screen.getByText('Account Feature Guide')).toBeInTheDocument()
    expect(screen.getByText('Marketplace')).toBeInTheDocument()
    expect(screen.getByText('Social Feed')).toBeInTheDocument()
    expect(screen.getByText('Lost & Found')).toBeInTheDocument()
    expect(screen.getByText('Messages & Chats')).toBeInTheDocument()
    expect(screen.getByText('Customer Service Chat')).toBeInTheDocument()
    expect(screen.queryByText('Customer Support Desk')).not.toBeInTheDocument()
  })

  it('shows CS desk for CS role and hides support chat', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'Agent', role: 'cs', subscription: { plan: 'basic' } },
    })

    renderWithRouter(<FeatureGuide />)

    expect(screen.getByText('Customer Support Desk')).toBeInTheDocument()
    expect(screen.queryByText('Customer Service Chat')).not.toBeInTheDocument()
  })
})
