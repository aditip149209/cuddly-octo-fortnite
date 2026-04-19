import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await loginWithEmail(email, password)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setSubmitting(true)
    setError(null)

    try {
      await loginWithGoogle()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google sign-in failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="auth-label">Welcome back</p>
        <h1>Login</h1>
        <p className="auth-subtitle">Sign in to continue to your dashboard.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}

          <button className="auth-btn auth-btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <button
          className="auth-btn auth-btn-secondary"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
        >
          Continue with Google
        </button>

        <p className="auth-footer">
          New here?{' '}
          <Link className="auth-link" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  )
}
