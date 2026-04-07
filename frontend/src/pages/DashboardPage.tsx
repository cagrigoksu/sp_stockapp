import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import StockPage from './StockPage'
import CountPage from './CountPage'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Device {
  id: number
  internal_barcode: string
  device_type: 'phone' | 'tablet'
  brand: string
  model: string
  connector: string
  is_engraved: number
  status: string
  place: string
}

interface Stats {
  phones: number
  tablets: number
  phonesEngraved: number
  phonesNotEngraved: number
  tabletsEngraved: number
  tabletsNotEngraved: number
  iosEngravedPhones: number
  iosNotEngravedPhones: number
  androidEngravedPhones: number
  androidNotEngravedPhones: number
  ipadosEngravedTablets: number
  androidEngravedTablets: number
  ipadosNotEngravedTablets: number
  androidNotEngravedTablets: number
}

const isApple = (brand: string) => brand.trim().toLowerCase() === 'apple'

function computeStats(devices: Device[]): Stats {
  const phones = devices.filter(d => d.device_type === 'phone')
  const tablets = devices.filter(d => d.device_type === 'tablet')
  const phonesEngraved = phones.filter(d => d.is_engraved).length
  const tabletsEngraved = tablets.filter(d => d.is_engraved).length
  const EngravedPhones = phones.filter(d => d.is_engraved)
  const EngravedTablets = tablets.filter(d => d.is_engraved)
  const NotEngravedPhones = phones.filter(d => !d.is_engraved)
  const NotEngravedTablets = tablets.filter(d => !d.is_engraved)
  return {
    phones: phones.length,
    tablets: tablets.length,
    phonesEngraved,
    phonesNotEngraved: phones.length - phonesEngraved,
    tabletsEngraved,
    tabletsNotEngraved: tablets.length - tabletsEngraved,

    iosEngravedPhones: EngravedPhones.filter(d => isApple(d.brand)).length,
    androidEngravedPhones: EngravedPhones.filter(d => !isApple(d.brand)).length,
    ipadosEngravedTablets: EngravedTablets.filter(d => isApple(d.brand)).length,
    androidEngravedTablets: EngravedTablets.filter(d => !isApple(d.brand)).length,

    iosNotEngravedPhones: NotEngravedPhones.filter(d => isApple(d.brand)).length,
    androidNotEngravedPhones: NotEngravedPhones.filter(d => !isApple(d.brand)).length,
    ipadosNotEngravedTablets: NotEngravedTablets.filter(d => isApple(d.brand)).length,
    androidNotEngravedTablets: NotEngravedTablets.filter(d => !isApple(d.brand)).length,
  }
}

// ─── Bar component ────────────────────────────────────────────────────────────

interface BarRowProps {
  labelA: string; colorA: string; countA: number
  labelB: string; colorB: string; countB: number
}

function CompareBar({ labelA, colorA, countA, labelB, colorB, countB }: BarRowProps) {
  const total = countA + countB
  const pctA = total === 0 ? 50 : Math.round((countA / total) * 100)
  const pctB = 100 - pctA
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ ...dot, background: colorA }} />
          <span style={barLabel}>{labelA}</span>
          <span style={{ ...countBadge, background: colorA + '22', color: colorA }}>{countA}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ ...countBadge, background: colorB + '22', color: colorB }}>{countB}</span>
          <span style={barLabel}>{labelB}</span>
          <span style={{ ...dot, background: colorB }} />
        </div>
      </div>
      <div style={barTrack}>
        {total === 0 ? (
          <div style={{ ...barFill, width: '100%', background: '#e0e0e0', borderRadius: 6 }} />
        ) : (
          <>
            <div style={{ ...barFill, width: `${pctA}%`, background: colorA, borderRadius: '6px 0 0 6px' }} />
            <div style={{ ...barFill, width: `${pctB}%`, background: colorB, borderRadius: '0 6px 6px 0' }} />
          </>
        )}
      </div>
      {total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <span style={pctLabel}>{pctA}%</span>
          <span style={pctLabel}>{pctB}%</span>
        </div>
      )}
      {total === 0 && <div style={{ ...pctLabel, textAlign: 'center', marginTop: 3 }}>No data</div>}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ title, children, loading }: { title: string; children: React.ReactNode; loading: boolean }) {
  return (
    <div style={statCard}>
      <div style={statCardTitle}>{title}</div>
      {loading ? <div style={muted}>Loading…</div> : children}
    </div>
  )
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type DashTab = 'overview' | 'devices' | 'count'

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<DashTab>('overview')

  useEffect(() => {
    client.get('/api/stock')
      .then(res => setDevices(res.data.devices ?? []))
      .catch(() => setDevices([]))
      .finally(() => setLoading(false))
  }, [])

  const s = computeStats(devices)

  const handleLogout = async () => {
    await client.post('/api/auth/logout')
    navigate('/login')
  }

  return (
    <div style={page}>
      {/* ── Nav ── */}
      <nav style={nav}>
        <span style={brand}>StockApp</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={divider} />
          <span style={userName}>{user?.user_name}</span>
          <button style={navBtn} onClick={() => navigate('/change-password')}>Change Password</button>
          <button style={navBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* ── Tab Bar ── */}
      <div style={tabBar}>
        <button style={tabBtn(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>
          🏠 Dashboard
        </button>
        <button style={tabBtn(activeTab === 'devices')} onClick={() => setActiveTab('devices')}>
          📦 Devices
        </button>
        <button style={tabBtn(activeTab === 'count')} onClick={() => setActiveTab('count')}>
          📋 Count
        </button>
      </div>

      {/* ── Tab Content ── */}

      {/* Overview tab — original dashboard content, unchanged */}
      {activeTab === 'overview' && (
        <div style={body}>
          <h2 style={heading}>Dashboard</h2>
          <p style={{ color: '#666', marginBottom: '1.75rem' }}>
            Welcome, <strong>{user?.user_name}</strong>.
          </p>

          {/* Stats */}
          <h3 style={sectionHeading}>Device Overview</h3>
          <div style={statsGrid}>
            <StatCard title="Phones vs Tablets" loading={loading}>
              <div style={totalRow}>
                <span style={{ ...bigNum, color: '#1565c0' }}>{s.phones}</span>
                <span style={totalLabel}>phones</span>
                <span style={vsText}>vs</span>
                <span style={{ ...bigNum, color: '#6a1b9a' }}>{s.tablets}</span>
                <span style={totalLabel}>tablets</span>
              </div>
              <CompareBar labelA="Phones" colorA="#1565c0" countA={s.phones} labelB="Tablets" colorB="#6a1b9a" countB={s.tablets} />
            </StatCard>

            <StatCard title="iOS vs Android — Phones" loading={loading}>
              <div style={totalRow}>
                <span style={{ ...bigNum, color: '#1565c0' }}>{s.iosEngravedPhones+s.iosNotEngravedPhones}</span>
                <span style={totalLabel}>iOS</span>
                <span style={vsText}>vs</span>
                <span style={{ ...bigNum, color: '#e65100' }}>{s.androidEngravedPhones+s.androidNotEngravedPhones}</span>
                <span style={totalLabel}>Android</span>
              </div>
              <CompareBar labelA="iOS" colorA="#1565c0" countA={s.iosEngravedPhones+s.iosNotEngravedPhones} labelB="Android" colorB="#e65100" countB={s.androidEngravedPhones+s.androidNotEngravedPhones} />
              <div style={hint}>Among all phones</div>
            </StatCard>

            <StatCard title="iOS vs Android — Tablets" loading={loading}>
              <div style={totalRow}>
                <span style={{ ...bigNum, color: '#1565c0' }}>{s.ipadosEngravedTablets+s.ipadosNotEngravedTablets}</span>
                <span style={totalLabel}>iOS</span>
                <span style={vsText}>vs</span>
                <span style={{ ...bigNum, color: '#e65100' }}>{s.androidEngravedTablets+s.androidNotEngravedTablets}</span>
                <span style={totalLabel}>Android</span>
              </div>
              <CompareBar labelA="iOS" colorA="#1565c0" countA={s.ipadosEngravedTablets+s.ipadosNotEngravedTablets} labelB="Android" colorB="#e65100" countB={s.androidEngravedTablets+s.androidNotEngravedTablets} />
              <div style={hint}>Among all tablets</div>
            </StatCard>

            <StatCard title="Engraved Phones" loading={loading}>
              <div style={totalRow}>
                <span style={{ ...bigNum, color: '#2e7d32' }}>{s.phonesEngraved}</span>
                <span style={totalLabel}>engraved</span>
                <span style={vsText}>vs</span>
                <span style={{ ...bigNum, color: '#888' }}>{s.phonesNotEngraved}</span>
                <span style={totalLabel}>not engraved</span>
              </div>
              <CompareBar labelA="Engraved" colorA="#2e7d32" countA={s.phonesEngraved} labelB="Not engraved" colorB="#bdbdbd" countB={s.phonesNotEngraved} />
            </StatCard>

            <StatCard title="iOS vs Android — Engraved Phones" loading={loading}>
              <div style={totalRow}>
                <span style={{ ...bigNum, color: '#1565c0' }}>{s.iosEngravedPhones}</span>
                <span style={totalLabel}>iOS</span>
                <span style={vsText}>vs</span>
                <span style={{ ...bigNum, color: '#e65100' }}>{s.androidEngravedPhones}</span>
                <span style={totalLabel}>Android</span>
              </div>
              <CompareBar labelA="iOS" colorA="#1565c0" countA={s.iosEngravedPhones} labelB="Android" colorB="#e65100" countB={s.androidEngravedPhones} />
              <div style={hint}>Among engraved phones only · Apple brand = iOS</div>
            </StatCard>

            <StatCard title="iOS vs Android — Not Engraved Phones" loading={loading}>
              <div style={totalRow}>
                <span style={{ ...bigNum, color: '#1565c0' }}>{s.iosNotEngravedPhones}</span>
                <span style={totalLabel}>iOS</span>
                <span style={vsText}>vs</span>
                <span style={{ ...bigNum, color: '#e65100' }}>{s.androidNotEngravedPhones}</span>
                <span style={totalLabel}>Android</span>
              </div>
              <CompareBar labelA="iOS" colorA="#1565c0" countA={s.iosNotEngravedPhones} labelB="Android" colorB="#e65100" countB={s.androidNotEngravedPhones} />
              <div style={hint}>Among not engraved phones only · Apple brand = iOS</div>
            </StatCard>

            <StatCard title="Engraved Tablets" loading={loading}>
              <div style={totalRow}>
                <span style={{ ...bigNum, color: '#2e7d32' }}>{s.tabletsEngraved}</span>
                <span style={totalLabel}>engraved</span>
                <span style={vsText}>vs</span>
                <span style={{ ...bigNum, color: '#888' }}>{s.tabletsNotEngraved}</span>
                <span style={totalLabel}>not engraved</span>
              </div>
              <CompareBar labelA="Engraved" colorA="#2e7d32" countA={s.tabletsEngraved} labelB="Not engraved" colorB="#bdbdbd" countB={s.tabletsNotEngraved} />
            </StatCard>



            <StatCard title="iPadOS vs Android — Engraved Tablets" loading={loading}>
              <div style={totalRow}>
                <span style={{ ...bigNum, color: '#1565c0' }}>{s.ipadosEngravedTablets}</span>
                <span style={totalLabel}>iPadOS</span>
                <span style={vsText}>vs</span>
                <span style={{ ...bigNum, color: '#e65100' }}>{s.androidEngravedTablets}</span>
                <span style={totalLabel}>Android</span>
              </div>
              <CompareBar labelA="iPadOS" colorA="#1565c0" countA={s.ipadosEngravedTablets} labelB="Android" colorB="#e65100" countB={s.androidEngravedTablets} />
              <div style={hint}>Among engraved tablets only · Apple brand = iPadOS</div>
            </StatCard>

            <StatCard title="iPadOS vs Android — Not Engraved Tablets" loading={loading}>
              <div style={totalRow}>
                <span style={{ ...bigNum, color: '#1565c0' }}>{s.ipadosNotEngravedTablets}</span>
                <span style={totalLabel}>iPadOS</span>
                <span style={vsText}>vs</span>
                <span style={{ ...bigNum, color: '#e65100' }}>{s.androidNotEngravedTablets}</span>
                <span style={totalLabel}>Android</span>
              </div>
              <CompareBar labelA="iPadOS" colorA="#1565c0" countA={s.ipadosNotEngravedTablets} labelB="Android" colorB="#e65100" countB={s.androidNotEngravedTablets} />
              <div style={hint}>Among not engraved tablets only</div>
            </StatCard>

          </div>
        </div>
      )}

      {/* Devices tab — renders StockPage content directly */}
      {activeTab === 'devices' && (
        <StockPage embedded />
      )}

      {/* Count tab — renders CountPage content directly */}
      {activeTab === 'count' && (
        <CountPage embedded />
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const page: React.CSSProperties = { minHeight: '100vh', background: '#f0f4f8' }
const nav: React.CSSProperties = { background: '#1a237e', padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const brand: React.CSSProperties = { color: '#fff', fontWeight: 700, fontSize: '1.2rem' }
const divider: React.CSSProperties = { width: 1, height: 20, background: 'rgba(255,255,255,0.3)' }
const userName: React.CSSProperties = { color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }
const navBtn: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: 6, padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.9rem' }

const tabBar: React.CSSProperties = { display: 'flex', gap: 4, padding: '0 1.5rem', borderBottom: '2px solid #dde3ed', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }
const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '0.65rem 1.3rem',
  border: 'none',
  background: 'transparent',
  color: active ? '#1a237e' : '#777',
  borderBottom: active ? '3px solid #1a237e' : '3px solid transparent',
  cursor: 'pointer',
  fontWeight: active ? 700 : 500,
  fontSize: '0.92rem',
  marginBottom: -2,
  transition: 'color 0.15s',
})

const body: React.CSSProperties = { padding: '2rem' }
const heading: React.CSSProperties = { fontWeight: 700, color: '#1a237e', marginBottom: '0.25rem', fontSize: '1.3rem' }
const sectionHeading: React.CSSProperties = { fontWeight: 700, color: '#1a237e', fontSize: '1rem', margin: '2rem 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }

const quickGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }
const quickCard: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: '1.25rem 1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', cursor: 'pointer' }

const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }
const statCard: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: '1.25rem 1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }
const statCardTitle: React.CSSProperties = { fontWeight: 700, fontSize: '0.88rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }

const totalRow: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }
const bigNum: React.CSSProperties = { fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }
const totalLabel: React.CSSProperties = { fontSize: '0.82rem', color: '#888', fontWeight: 500 }
const vsText: React.CSSProperties = { fontSize: '0.8rem', color: '#bbb', fontWeight: 600, margin: '0 4px' }

const barTrack: React.CSSProperties = { display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: '#f0f2f7' }
const barFill: React.CSSProperties = { height: '100%' }
const dot: React.CSSProperties = { display: 'inline-block', width: 9, height: 9, borderRadius: '50%', flexShrink: 0 }
const barLabel: React.CSSProperties = { fontSize: '0.8rem', color: '#555', fontWeight: 600 }
const countBadge: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 700, borderRadius: 20, padding: '0.05rem 0.5rem' }
const pctLabel: React.CSSProperties = { fontSize: '0.72rem', color: '#aaa' }
const hint: React.CSSProperties = { fontSize: '0.72rem', color: '#bbb', marginTop: 8 }
const muted: React.CSSProperties = { color: '#bbb', fontSize: '0.88rem', padding: '1rem 0' }
