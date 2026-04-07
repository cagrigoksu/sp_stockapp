import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

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
  iosEngravdPhones: number
  androidEngravdPhones: number
  ipadosEngravdTablets: number
  androidEngravdTablets: number
}

// iOS = Apple brand, everything else = Android/other
const isApple = (brand: string) => brand.trim().toLowerCase() === 'apple'

function computeStats(devices: Device[]): Stats {
  const phones = devices.filter(d => d.device_type === 'phone')
  const tablets = devices.filter(d => d.device_type === 'tablet')

  const phonesEngraved = phones.filter(d => d.is_engraved).length
  const tabletsEngraved = tablets.filter(d => d.is_engraved).length

  const engravdPhones = phones.filter(d => d.is_engraved)
  const engravdTablets = tablets.filter(d => d.is_engraved)

  return {
    phones: phones.length,
    tablets: tablets.length,
    phonesEngraved,
    phonesNotEngraved: phones.length - phonesEngraved,
    tabletsEngraved,
    tabletsNotEngraved: tablets.length - tabletsEngraved,
    iosEngravdPhones: engravdPhones.filter(d => isApple(d.brand)).length,
    androidEngravdPhones: engravdPhones.filter(d => !isApple(d.brand)).length,
    ipadosEngravdTablets: engravdTablets.filter(d => isApple(d.brand)).length,
    androidEngravdTablets: engravdTablets.filter(d => !isApple(d.brand)).length,
  }
}

// ─── Bar component ────────────────────────────────────────────────────────────

interface BarRowProps {
  labelA: string
  colorA: string
  countA: number
  labelB: string
  colorB: string
  countB: number
}

function CompareBar({ labelA, colorA, countA, labelB, colorB, countB }: BarRowProps) {
  const total = countA + countB
  const pctA = total === 0 ? 50 : Math.round((countA / total) * 100)
  const pctB = 100 - pctA

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Labels + counts */}
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
      {/* Bar */}
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
      {/* Pct labels */}
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

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
      <nav style={nav}>
        <span style={brand}>StockApp</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={navBtn} onClick={() => navigate('/stock')}>📦 Stock</button>
          <button style={navBtn} onClick={() => navigate('/count')}>📋 Count</button>
          <span style={divider} />
          <span style={userName}>{user?.user_name}</span>
          <button style={navBtn} onClick={() => navigate('/change-password')}>Change Password</button>
          <button style={navBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={body}>
        <h2 style={heading}>Dashboard</h2>
        <p style={{ color: '#666', marginBottom: '1.75rem' }}>
          Welcome back, <strong>{user?.user_name}</strong>.
        </p>

        {/* ── Quick nav cards ── */}
        <div style={quickGrid}>
          {[
            { label: 'Devices', icon: '📱', path: '/stock' },
            { label: 'Stock Count', icon: '📋', path: '/count' },
          ].map(s => (
            <div key={s.label} style={quickCard} onClick={() => navigate(s.path)}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontWeight: 600, color: '#1a237e', fontSize: '0.95rem' }}>{s.label}</div>
              <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: 2 }}>View & manage →</div>
            </div>
          ))}
        </div>

        {/* ── Stats section ── */}
        <h3 style={sectionHeading}>Device Overview</h3>
        <div style={statsGrid}>

          {/* 1 phones vs tablets */}
          <StatCard title="Phones vs Tablets" loading={loading}>
            <div style={totalRow}>
              <span style={{ ...bigNum, color: '#1565c0' }}>{s.phones}</span>
              <span style={totalLabel}>phones</span>
              <span style={vsText}>vs</span>
              <span style={{ ...bigNum, color: '#6a1b9a' }}>{s.tablets}</span>
              <span style={totalLabel}>tablets</span>
            </div>
            <CompareBar
              labelA="Phones" colorA="#1565c0" countA={s.phones}
              labelB="Tablets" colorB="#6a1b9a" countB={s.tablets}
            />
          </StatCard>

          {/* 2 phone engraved */}
          <StatCard title="Engraved Phones" loading={loading}>
            <div style={totalRow}>
              <span style={{ ...bigNum, color: '#2e7d32' }}>{s.phonesEngraved}</span>
              <span style={totalLabel}>engraved</span>
              <span style={vsText}>vs</span>
              <span style={{ ...bigNum, color: '#888' }}>{s.phonesNotEngraved}</span>
              <span style={totalLabel}>not engraved</span>
            </div>
            <CompareBar
              labelA="Engraved" colorA="#2e7d32" countA={s.phonesEngraved}
              labelB="Not engraved" colorB="#bdbdbd" countB={s.phonesNotEngraved}
            />
          </StatCard>

          {/* 3 tablet engraved */}
          <StatCard title="Engraved Tablets" loading={loading}>
            <div style={totalRow}>
              <span style={{ ...bigNum, color: '#2e7d32' }}>{s.tabletsEngraved}</span>
              <span style={totalLabel}>engraved</span>
              <span style={vsText}>vs</span>
              <span style={{ ...bigNum, color: '#888' }}>{s.tabletsNotEngraved}</span>
              <span style={totalLabel}>not engraved</span>
            </div>
            <CompareBar
              labelA="Engraved" colorA="#2e7d32" countA={s.tabletsEngraved}
              labelB="Not engraved" colorB="#bdbdbd" countB={s.tabletsNotEngraved}
            />
          </StatCard>

          {/* 4 iOS vs android (engraved phones) */}
          <StatCard title="iOS vs Android — Engraved Phones" loading={loading}>
            <div style={totalRow}>
              <span style={{ ...bigNum, color: '#1565c0' }}>{s.iosEngravdPhones}</span>
              <span style={totalLabel}>iOS</span>
              <span style={vsText}>vs</span>
              <span style={{ ...bigNum, color: '#e65100' }}>{s.androidEngravdPhones}</span>
              <span style={totalLabel}>Android</span>
            </div>
            <CompareBar
              labelA="iOS" colorA="#1565c0" countA={s.iosEngravdPhones}
              labelB="Android" colorB="#e65100" countB={s.androidEngravdPhones}
            />
            <div style={hint}>Among engraved phones only · Apple brand = iOS</div>
          </StatCard>

          {/* 5  iPadOS vs android (engraved tablets) */}
          <StatCard title="iPadOS vs Android — Engraved Tablets" loading={loading}>
            <div style={totalRow}>
              <span style={{ ...bigNum, color: '#1565c0' }}>{s.ipadosEngravdTablets}</span>
              <span style={totalLabel}>iPadOS</span>
              <span style={vsText}>vs</span>
              <span style={{ ...bigNum, color: '#e65100' }}>{s.androidEngravdTablets}</span>
              <span style={totalLabel}>Android</span>
            </div>
            <CompareBar
              labelA="iPadOS" colorA="#1565c0" countA={s.ipadosEngravdTablets}
              labelB="Android" colorB="#e65100" countB={s.androidEngravdTablets}
            />
            <div style={hint}>Among engraved tablets only · Apple brand = iPadOS</div>
          </StatCard>

        </div>
      </div>
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
