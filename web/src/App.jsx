import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { LayoutProvider } from './context/LayoutContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import BuyerHub from './pages/BuyerHub'
import Marketplace from './pages/Marketplace'
import Social from './pages/Social'
import LostFound from './pages/LostFound'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import AccountManager from './pages/AccountManager'
import Subscription from './pages/Subscription'
import BecomeSeller from './pages/BecomeSeller'
import ProductDetails from './pages/ProductDetails'
import AdminDashboard from './pages/AdminDashboard'
import Legal from './pages/Legal'
import nexwadLogo from './assets/images/nexwad-logo.png'

function AppContent() {
  const location = useLocation()
  const isFirstRoute = useRef(true)
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    if (isFirstRoute.current) {
      isFirstRoute.current = false
      return
    }

    setRouteLoading(true)
    const timer = window.setTimeout(() => setRouteLoading(false), 420)
    return () => window.clearTimeout(timer)
  }, [location.pathname, location.search])

  return (
    <>
      {routeLoading && (
        <div className="route-loader" role="status" aria-live="polite" aria-label="Loading page">
          <img src={nexwadLogo} alt="NexWAD" className="route-loader__logo" />
          <span className="spinner route-loader__spinner" />
        </div>
      )}
      <ThemeProvider>
        <AuthProvider>
          <LayoutProvider>
            <SocketProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    fontFamily: 'var(--font-body)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.9rem',
                    boxShadow: 'var(--shadow-lg)',
                  },
                }}
              />
              <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:listingId" element={<ProductDetails />} />
              <Route path="/social" element={<Social />} />
              <Route path="/lost-found" element={<LostFound />} />
              <Route path="/legal-page" element={<Navigate to="/legal" replace />} />
              <Route path="/terms-and-conditions" element={<Navigate to="/legal" replace />} />
              <Route path="/privacy-policy" element={<Navigate to="/legal" replace />} />
              <Route path="/cookies-policy" element={<Navigate to="/legal" replace />} />
              <Route path="/data-retention-policy" element={<Navigate to="/legal" replace />} />

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<BuyerHub />} />
                <Route element={<ProtectedRoute requiredRole="seller" fallbackTo="/home" />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                </Route>
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:chatId" element={<Chat />} />
                <Route path="/profile/settings" element={<Settings />} />
                <Route path="/profile/account-manager" element={<AccountManager />} />
                <Route path="/profile/subscription" element={<Subscription />} />
                <Route path="/profile/become-seller" element={<BecomeSeller />} />
                <Route path="/profile/:userId?" element={<Profile />} />
              </Route>

              {/* Admin */}
              <Route element={<ProtectedRoute requiredRole={['admin', 'superadmin', 'super_admin']} />}>
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Route>
              <Route element={<ProtectedRoute requiredRole={['superadmin', 'super_admin']} fallbackTo="/admin" />}>
                <Route path="/super-admin/*" element={<AdminDashboard />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SocketProvider>
          </LayoutProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
