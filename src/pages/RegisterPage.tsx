import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function RegisterPage() {
  const { registerWithEmail, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await registerWithEmail(email, password)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to create account.')
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
      setError(error instanceof Error ? error.message : 'Google sign-up failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="auth-label">Let&apos;s get started</p>
        <h1>Register</h1>
        <p className="auth-subtitle">Create your account in under a minute.</p>

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

          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}

          <button className="auth-btn auth-btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
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
          Already have an account?{' '}
          <Link className="auth-link" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  )
}
