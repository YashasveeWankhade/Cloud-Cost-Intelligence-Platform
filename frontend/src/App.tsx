import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import CostAnalyticsPage from './pages/CostAnalyticsPage'
import AnomaliesPage from './pages/AnomaliesPage'
import RootCausePage from './pages/RootCausePage'
import RecommendationsPage from './pages/RecommendationsPage'
import CostUniversePage from './pages/CostUniversePage'
import AccountsPage from './pages/AccountsPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="analytics" element={<CostAnalyticsPage />} />
          <Route path="anomalies" element={<AnomaliesPage />} />
          <Route path="root-cause" element={<RootCausePage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="universe" element={<CostUniversePage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
