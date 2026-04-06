import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.must_change_password) {
        navigate('/change-password-first')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>StockApp</h1>
        <p style={styles.subtitle}>Inventory Management System</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={styles.hint}>
          Default: <strong>admin@stockapp.com</strong> / <strong>Admin1234!</strong>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' },
  card: { background: '#fff', borderRadius: 12, padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' },
  title: { margin: 0, fontSize: '1.8rem', fontWeight: 700, color: '#1a237e', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: '1.5rem', marginTop: '0.25rem' },
  error: { background: '#fdecea', color: '#c62828', border: '1px solid #f5c6cb', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', background: '#1565c0', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
  hint: { marginTop: '1rem', background: '#f0f7ff', border: '1px solid #bee3f8', borderRadius: 8, padding: '0.65rem', fontSize: '0.82rem', color: '#1565c0' },
}