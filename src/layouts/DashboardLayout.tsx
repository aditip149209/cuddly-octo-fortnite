import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './DashboardLayout.css'

export default function DashboardLayout() {
  const { user, logout } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>CV Project</h2>
          <p className="user-email">{user.email}</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard/history"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Upload History
          </NavLink>
          <NavLink
            to="/dashboard/upload"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Upload Image
          </NavLink>
          <NavLink
            to="/dashboard/model-info"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Model Information
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button className="auth-btn auth-btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  )
}
