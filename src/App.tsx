import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardLayout from './layouts/DashboardLayout'
import HistoryPage from './pages/HistoryPage'
import UploadPage from './pages/UploadPage'
import ModelInfoPage from './pages/ModelInfoPage'
import './App.css'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <section className="auth-shell">
        <div className="auth-card">
          <h1>Checking session...</h1>
          <p className="auth-subtitle">One second while we load your account.</p>
        </div>
      </section>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Navigate to="history" replace />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="model-info" element={<ModelInfoPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
