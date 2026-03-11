import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { canPinContent } from '../utils/pins'

function buildFeatures(user) {
  const role = String(user?.role || '').toLowerCase()
  const plan = String(user?.subscription?.plan || '').toLowerCase()
  const isSeller = role === 'seller'
  const isAdmin = ['admin', 'superadmin', 'super_admin', 'moderator', 'cs'].includes(role)
  const hasPinAccess = canPinContent(user)

  const features = [
    {
      id: 'marketplace',
      title: 'Marketplace',
      description: 'Browse products, save items, and contact sellers through chat.',
      steps: [
        'Open Marketplace from the sidebar or top nav.',
        'Use search and filters to narrow products.',
        'Open any product and tap Get Product to start a chat with seller.',
      ],
      ctaLabel: 'Open Marketplace',
      to: '/marketplace',
    },
    {
      id: 'social',
      title: 'Social Feed',
      description: 'Post updates, like posts, comment, share, and open post threads.',
      steps: [
        'Go to Social Feed.',
        'Create a post with text or photo.',
        'Tap a post to open full thread and comments.',
      ],
      ctaLabel: 'Open Social Feed',
      to: '/social',
    },
    {
      id: 'lostfound',
      title: 'Lost & Found',
      description: 'Report lost/found items and respond to active reports.',
      steps: [
        'Open Lost & Found.',
        'Choose Report Lost Item or I Found Something.',
        'Track status and resolve when completed.',
      ],
      ctaLabel: 'Open Lost & Found',
      to: '/lost-found',
    },
    {
      id: 'profile',
      title: 'Profile & Account',
      description: 'Manage your bio, photo, website link, and account details.',
      steps: [
        'Open Profile and tap Edit Profile to update public info.',
        'Open Account Manager for security and key account details.',
        'Use Settings to choose your app theme and preferences.',
      ],
      ctaLabel: 'Open Profile',
      to: '/profile',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'View updates from messages, likes, follows, and account actions.',
      steps: [
        'Tap the bell icon in the navbar.',
        'Open the notifications page to see full history.',
        'Expand items to read details and follow links.',
      ],
      ctaLabel: 'Open Notifications',
      to: '/notifications',
    },
  ]

  if (hasPinAccess) {
    features.push({
      id: 'pinning',
      title: 'Pin Listings',
      description: 'Pin your own listings for extra visibility.',
      steps: [
        'Open your own listing.',
        'Tap Pin to pin for 24 hours.',
        'Use Unpin anytime before expiry.',
      ],
      ctaLabel: 'Open My Profile',
      to: '/profile',
      badge: 'Premium Access',
    })
  }

  if (isSeller) {
    features.push({
      id: 'seller',
      title: 'Seller Tools',
      description: 'Manage listings, performance, storefront identity, and seller utilities.',
      steps: [
        'Open Dashboard to track active listings and stats.',
        'Create or update listings from Marketplace.',
        'Open Seller Tools for branded assets and seller-focused actions.',
      ],
      ctaLabel: 'Open Seller Dashboard',
      to: '/dashboard',
      badge: 'Seller',
    })
  }

  if (!isSeller) {
    features.push({
      id: 'become-seller',
      title: 'Become a Seller',
      description: 'Apply for seller access to start listing products.',
      steps: [
        'Open Subscription or Become Seller.',
        'Choose seller plan and complete application/payment.',
        'Wait for approval, then access seller dashboard.',
      ],
      ctaLabel: 'Start Seller Application',
      to: '/profile/become-seller',
    })
  }

  if (isAdmin) {
    features.push({
      id: 'admin',
      title: 'Admin Moderation',
      description: 'Manage users, reports, listings, and apply warnings before bans.',
      steps: [
        'Open Admin Panel from main navigation.',
        'Review reports and choose Dismiss, Warn, or Remove.',
        'Use Users tab to warn users and track warning counts.',
      ],
      ctaLabel: 'Open Admin Panel',
      to: role === 'superadmin' || role === 'super_admin' ? '/super-admin' : '/admin',
      badge: 'Admin',
    })
  }

  if (['premium_buyer', 'silver', 'premium'].includes(plan)) {
    features.push({
      id: 'subscription',
      title: 'Premium Plan Benefits',
      description: 'Your current plan unlocks enhanced buyer access and extra tools.',
      steps: [
        'Open Subscription to view active plan and renewal details.',
        'Use enabled premium features shown in your account.',
        'Upgrade, downgrade, or cancel from Subscription page.',
      ],
      ctaLabel: 'Open Subscription',
      to: '/profile/subscription',
      badge: 'Premium',
    })
  }

  return features
}

export default function FeatureGuide() {
  const { user } = useAuth()
  const features = buildFeatures(user)

  return (
    <div>
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-header" style={{ marginBottom: 'var(--space-5)' }}>
            <h1 className="page-header__title">Account Feature Guide</h1>
            <p className="page-header__sub">
              Features available on your account and how to use them.
            </p>
          </div>

          <div className="card card-body" style={{ maxWidth: 980, marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{user?.name || 'User'}</div>
                <div className="caption">
                  Role: {user?.role || 'buyer'} · Plan: {user?.subscription?.plan || 'basic'}
                </div>
              </div>
              <Link to="/profile/settings" className="btn btn-secondary">Back to Settings</Link>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 980 }}>
            {features.map((feature) => (
              <article key={feature.id} className="card card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{feature.title}</h2>
                      {feature.badge && <span className="badge badge-primary">{feature.badge}</span>}
                    </div>
                    <p style={{ color: 'var(--nw-gray-600)', marginBottom: 10 }}>{feature.description}</p>
                    <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--nw-gray-700)' }}>
                      {feature.steps.map((step) => (
                        <li key={step} style={{ marginBottom: 6 }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <Link to={feature.to} className="btn btn-primary btn-sm">{feature.ctaLabel}</Link>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
