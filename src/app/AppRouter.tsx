import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isLocalAdminHost } from './adminAccess'
import { Layout } from '../components/Layout'
import { AboutPage } from '../pages/AboutPage'
import { AdminPage } from '../pages/AdminPage'
import { DesignSystemPage } from '../pages/DesignSystemPage'
import { HomePage } from '../pages/HomePage'
import { LeaderboardPage } from '../pages/LeaderboardPage'
import { LoginPage } from '../pages/LoginPage'
import { MaterialDetailPage } from '../pages/MaterialDetailPage'
import { MaterialsPage } from '../pages/MaterialsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { RegisterPage } from '../pages/RegisterPage'
import { TestDetailPage } from '../pages/TestDetailPage'
import { TestsPage } from '../pages/TestsPage'

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/design-system" element={<DesignSystemPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/tests/:slug" element={<TestDetailPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/materials/:slug" element={<MaterialDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/admin"
            element={isLocalAdminHost() ? <AdminPage /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
