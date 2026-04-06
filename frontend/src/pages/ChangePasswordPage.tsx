import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      await client.post('/api/auth/change-password', { current_password: current, password, password2 })
      setSuccess('Password changed successfully!')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.brand}>StockApp</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.navBtn} onClick={() => navigate('/dashboard')}>← Back</button>
          <button style={styles.navBtn} onClick={async () => { await client.post('/api/auth/logout'); navigate('/login') }}>Logout</button>
        </div>
      </nav>
      <div style={styles.container}>
        <div style={styles.card}>
          <h4 style={styles.title}>Change Password</h4>
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}
          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Current Password</label>
              <input style={styles.input} type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>New Password <span style={{ color: '#888' }}>(min. 8 characters)</span></label>
              <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Confirm New Password</label>
              <input style={styles.input} type="password" value={password2} onChange={e => setPassword2(e.target.value)} required />
            </div>
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f0f4f8' },
  nav: { background: '#1a237e', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: '#fff', fontWeight: 700, fontSize: '1.2rem' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: 6, padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.9rem' },
  container: { display: 'flex', justifyContent: 'center', marginTop: '3rem', padding: '0 1rem' },
  card: { background: '#fff', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 480, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { margin: '0 0 1.5rem', fontWeight: 700, color: '#1a237e' },
  error: { background: '#fdecea', color: '#c62828', border: '1px solid #f5c6cb', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem' },
  successBox: { background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', background: '#1565c0', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
}