import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { ListingCard } from '../components/Card'
import { listingsAPI, postsAPI, usersAPI } from '../api/endpoints'
import { getUserPath } from '../utils/userPath'
import { getVerificationBadge } from '../utils/verification'
import VerificationBadge from '../components/VerificationBadge'

const FILTERS = ['all', 'people', 'products', 'posts']

function normalize(text) {
  return String(text || '').toLowerCase()
}

export default function SearchResults() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() || ''

  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [people, setPeople] = useState([])
  const [posts, setPosts] = useState([])

  useEffect(() => {
    let mounted = true

    const runSearch = async () => {
      if (!query) {
        setProducts([])
        setPeople([])
        setPosts([])
        return
      }

      setLoading(true)
      try {
        const [productsRes, postsRes, peopleRes] = await Promise.allSettled([
          listingsAPI.getAll({ q: query, page: 1, limit: 12 }),
          postsAPI.getFeed({ q: query, page: 1, limit: 60 }),
          usersAPI.search(query),
        ])

        if (!mounted) return

        const productItems = productsRes.status === 'fulfilled' ? (productsRes.value?.data?.listings || []) : []
        const q = normalize(query)
        const postItems = postsRes.status === 'fulfilled' ? (postsRes.value?.data?.posts || []) : []
        const peopleMap = new Map()

        // Guest-safe people results from public listing sellers and post authors.
        productItems.forEach((item) => {
          const person = item?.seller
          const id = person?._id
          const name = normalize(person?.name)
          const username = normalize(person?.username)
          if (!id || (!name.includes(q) && !username.includes(q))) return
          peopleMap.set(id, person)
        })
        postItems.forEach((item) => {
          const person = item?.author
          const id = person?._id
          const name = normalize(person?.name)
          const username = normalize(person?.username)
          if (!id || (!name.includes(q) && !username.includes(q))) return
          peopleMap.set(id, person)
        })

        // Enrich people results via dedicated user search endpoint.
        const apiPeople = peopleRes.status === 'fulfilled' ? (peopleRes.value?.data?.users || []) : []
        apiPeople.forEach((person) => {
          if (person?._id) peopleMap.set(person._id, person)
        })

        setProducts(productItems)
        setPosts(postItems)
        setPeople(Array.from(peopleMap.values()))
        if (productsRes.status === 'rejected' && postsRes.status === 'rejected' && peopleRes.status === 'rejected') {
          toast.error('Search failed. Try again.')
        }
      } catch {
        if (mounted) toast.error('Search failed. Try again.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    runSearch()
    return () => { mounted = false }
  }, [query])

  const totalCount = useMemo(
    () => products.length + people.length + posts.length,
    [products.length, people.length, posts.length]
  )

  const showPeople = activeFilter === 'all' || activeFilter === 'people'
  const showProducts = activeFilter === 'all' || activeFilter === 'products'
  const showPosts = activeFilter === 'all' || activeFilter === 'posts'

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
            <h1 className="page-header__title">Search Results</h1>
            <p className="page-header__sub">
              {query ? `${totalCount} result${totalCount === 1 ? '' : 's'} for "${query}"` : 'Type a search term to find people, products, and posts'}
            </p>
          </div>

          <div className="filter-bar">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter[0].toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {!query ? (
            <div className="empty-state">
              <div className="empty-state__icon" style={{ fontSize: '1.6rem' }}>
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              </div>
              <div className="empty-state__title">Start searching</div>
              <div className="empty-state__text">Find people, products, and posts from the top search bar.</div>
            </div>
          ) : loading ? (
            <div className="grid-3">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-xl)' }} />
              ))}
            </div>
          ) : (
            <>
              {showPeople && (
                <section style={{ marginBottom: 'var(--space-8)' }}>
                  <div className="section-header-row" style={{ marginBottom: 'var(--space-4)' }}>
                    <h2 className="heading">People ({people.length})</h2>
                  </div>
                  {people.length > 0 ? (
                    <div className="grid-3">
                      {people.map((person) => {
                        const badge = getVerificationBadge(person)
                        return (
                        <button
                          key={person._id}
                          type="button"
                          onClick={() => navigate(getUserPath(person))}
                          className="card card-body"
                          style={{ textAlign: 'left', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div className="avatar avatar-md">
                              {person.avatar
                                ? <img src={person.avatar} alt={person.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                : person.name?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                {person.name}
                                {badge && <VerificationBadge variant={badge.variant} label={badge.label} size={12} />}
                              </div>
                              <div className="caption">
                                {person.username ? `@${person.username} · ` : ''}
                                {person.department || person.role || person.buyerType || 'NexWAD member'}
                              </div>
                            </div>
                          </div>
                        </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="card card-body caption" style={{ color: 'var(--nw-gray-500)' }}>
                      No people found.
                    </div>
                  )}
                </section>
              )}

              {showProducts && (
                <section style={{ marginBottom: 'var(--space-8)' }}>
                  <div className="section-header-row" style={{ marginBottom: 'var(--space-4)' }}>
                    <h2 className="heading">Products ({products.length})</h2>
                    <Link to={`/marketplace?q=${encodeURIComponent(query)}`} className="caption" style={{ color: 'var(--nw-primary)' }}>
                      Open in Marketplace
                    </Link>
                  </div>
                  {products.length > 0 ? (
                    <div className="grid-3">
                      {products.map((listing) => <ListingCard key={listing._id} listing={listing} />)}
                    </div>
                  ) : (
                    <div className="card card-body caption" style={{ color: 'var(--nw-gray-500)' }}>No products found.</div>
                  )}
                </section>
              )}

              {showPosts && (
                <section>
                  <div className="section-header-row" style={{ marginBottom: 'var(--space-4)' }}>
                    <h2 className="heading">Posts ({posts.length})</h2>
                    <Link to="/social" className="caption" style={{ color: 'var(--nw-primary)' }}>
                      Open Social Feed
                    </Link>
                  </div>
                  {posts.length > 0 ? (
                    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                      {posts.map((post) => (
                        <article key={post._id} className="card card-body">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                            <button
                              type="button"
                              onClick={() => post?.author?._id && navigate(getUserPath(post.author))}
                              style={{ border: 'none', background: 'transparent', padding: 0, color: 'var(--nw-ink)', fontWeight: 700, cursor: 'pointer' }}
                            >
                              {post.author?.name || 'Student'}
                            </button>
                            <span className="caption">
                              {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
                            </span>
                          </div>
                          <p style={{ color: 'var(--nw-gray-700)' }}>{post.content || 'Photo post'}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="card card-body caption" style={{ color: 'var(--nw-gray-500)' }}>No posts found.</div>
                  )}
                </section>
              )}

              {totalCount === 0 && (
                <div className="empty-state">
                  <div className="empty-state__icon" style={{ fontSize: '1.6rem' }}>
                    <i className="fa-solid fa-filter-circle-xmark" aria-hidden="true" />
                  </div>
                  <div className="empty-state__title">No results found</div>
                  <div className="empty-state__text">Try another keyword or switch filter tabs.</div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
