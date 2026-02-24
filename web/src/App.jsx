import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { LayoutProvider } from './context/LayoutContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import Social from './pages/Social'
import LostFound from './pages/LostFound'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Subscription from './pages/Subscription'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
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

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/social" element={<Social />} />
                <Route path="/lost-found" element={<LostFound />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:chatId" element={<Chat />} />
                <Route path="/profile/settings" element={<Settings />} />
                <Route path="/profile/subscription" element={<Subscription />} />
                <Route path="/profile/:userId?" element={<Profile />} />
              </Route>

              {/* Admin */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </LayoutProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
