import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import Social from '../../pages/Social'
import { renderWithRouter } from '../test-utils'

vi.mock('../../components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }))
vi.mock('../../components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }))
vi.mock('../../components/Modal', () => ({ default: ({ children }) => <div data-testid="modal">{children}</div> }))
vi.mock('../../components/Card', () => ({
  PostCard: ({ post }) => <div data-testid="post-card">{post.content}</div>,
}))

vi.mock('../../utils/feedAlgorithm', () => ({
  rankFeed: (posts) => posts,
  deduplicateFeed: (posts) => posts,
}))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockPostsAPI = vi.hoisted(() => ({
  getFeed: vi.fn(),
  create: vi.fn(),
  getComments: vi.fn(),
  comment: vi.fn(),
  likeComment: vi.fn(),
  shareComment: vi.fn(),
  replyComment: vi.fn(),
}))
const mockListingsAPI = vi.hoisted(() => ({ getPinned: vi.fn() }))
vi.mock('../../api/endpoints', () => ({
  postsAPI: mockPostsAPI,
  listingsAPI: mockListingsAPI,
}))

describe('Social', () => {
  it('renders feed posts from API', async () => {
    mockUseAuth.mockReturnValue({ user: { _id: 'u1' }, isAuthenticated: true })
    mockPostsAPI.getFeed.mockResolvedValue({
      data: {
        posts: [{ _id: 'p1', content: 'Hello world' }],
        hasMore: false,
      },
    })
    mockListingsAPI.getPinned.mockResolvedValue({ data: { listings: [] } })

    renderWithRouter(<Social />)

    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument()
    })
  })
})
