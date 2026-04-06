import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function ChangePasswordFirstPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== password2) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      console.log(password)
      await client.post('/api/auth/change-password-first', { password, password2 })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Set Your New Password</h2>
        <p style={styles.subtitle}>You must change your password before continuing</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>New Password <span style={{ color: '#888' }}>(min. 8 characters)</span></label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <input style={styles.input} type="password" value={password2} onChange={e => setPassword2(e.target.value)} required />
            {password2 && (
              <small style={{ color: password === password2 ? 'green' : 'red' }}>
                {password === password2 ? '✓ Passwords match' : '✗ Passwords do not match'}
              </small>
            )}
          </div>
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' },
  card: { background: '#fff', borderRadius: 12, padding: '2.5rem', width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' },
  title: { margin: 0, fontWeight: 700, color: '#1a237e' },
  subtitle: { color: '#666', marginBottom: '1.5rem', marginTop: '0.25rem', fontSize: '0.9rem' },
  error: { background: '#fdecea', color: '#c62828', border: '1px solid #f5c6cb', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', background: '#1565c0', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
}