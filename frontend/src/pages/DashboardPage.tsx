import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await client.post('/api/auth/logout')
    navigate('/login')
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.brand}>StockApp</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={styles.userName}>{user?.user_name}</span>
          <button style={styles.navBtn} onClick={() => navigate('/change-password')}>Change Password</button>
          <button style={styles.navBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <div style={styles.body}>
        <h2 style={styles.heading}>Dashboard</h2>
        <p style={{ color: '#666' }}>Welcome back, <strong>{user?.user_name}</strong>. The inventory overview will appear here.</p>
        <div style={styles.grid}>
          {['Devices', 'Chargers', 'Cables', 'Stock Count'].map(section => (
            <div key={section} style={styles.card}>
              <h3 style={styles.cardTitle}>{section}</h3>
              <p style={styles.cardText}>— coming soon —</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f0f4f8' },
  nav: { background: '#1a237e', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: '#fff', fontWeight: 700, fontSize: '1.2rem' },
  userName: { color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' },
  navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: 6, padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.9rem' },
  body: { padding: '2rem' },
  heading: { fontWeight: 700, color: '#1a237e', marginBottom: '0.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.5rem' },
  card: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  cardTitle: { margin: '0 0 0.5rem', fontWeight: 600, color: '#1a237e', fontSize: '1rem' },
  cardText: { color: '#aaa', margin: 0, fontSize: '0.9rem' },
}