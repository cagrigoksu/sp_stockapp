import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import StockPage from './StockPage'
import CountPage from './CountPage'

//TODO: in overview, show comparison dist. vs not distributed
//TODO: in overview analytics, exclude distributed

interface Device {
  id: number
  internal_barcode: string
  device_type: 'phone' | 'tablet'
  brand: string
  model: string
  connector: string
  is_engraved: number
  is_distributed: number
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
  distributedDevices: number
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
  const DistributedDevices = devices.filter(d => d.is_distributed)
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
    distributedDevices: DistributedDevices.length
  }
}

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

function StatCard({ title, children, loading }: { title: string; children: React.ReactNode; loading: boolean }) {
  return (
    <div style={statCard}>
      <div style={statCardTitle}>{title}</div>
      {loading ? <div style={muted}>Loading…</div> : children}
    </div>
  )
}

type DashTab = 'overview' | 'devices' | 'count' | 'report'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<DashTab>('overview')

  useEffect(() => {
    if (activeTab !== 'overview' && activeTab !== 'report') return
    setLoading(true)
    client.get('/api/stock')
      .then(res => setDevices(res.data.devices ?? []))
      .catch(() => setDevices([]))
      .finally(() => setLoading(false))
  }, [activeTab])

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
          <span style={divider} />
          <span style={userName}>{user?.user_name}</span>
          <button style={navBtn} onClick={() => navigate('/change-password')}>Change Password</button>
          <button style={navBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

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
        <button style={tabBtn(activeTab === 'report')} onClick={() => setActiveTab('report')}>
          📊 Report
        </button>
      </div>

      {activeTab === 'overview' && (
        <div style={body}>

          <h2 style={heading}>Dashboard</h2>
          <p style={{ color: '#666', marginBottom: '1.75rem' }}>
            Welcome, <strong>{user?.user_name}</strong>.
          </p>

          <h3 style={sectionHeading}>Device Overview</h3>

          <div style={fullRow}>
            <StatCard title="Phones vs Tablets" loading={loading}>
              <CompareBar
                labelA="Phones"
                colorA="#f3cf00"
                countA={s.phones}
                labelB="Tablets"
                colorB="#6a1b9a"
                countB={s.tablets}
              />
            </StatCard>
          </div>

          <div style={overviewRow}>

            <StatCard title="Engraved Phones" loading={loading}>
              <CompareBar
                labelA="Engraved"
                colorA="#227d27"
                countA={s.phonesEngraved}
                labelB="Not engraved"
                colorB="#a10707"
                countB={s.phonesNotEngraved}
              />
            </StatCard>

            <StatCard title="iOS vs Android — Phones" loading={loading}>
              <CompareBar
                labelA="iOS"
                colorA="#f09e2a"
                countA={s.iosEngravedPhones + s.iosNotEngravedPhones}
                labelB="Android"
                colorB="#1faf56"
                countB={s.androidEngravedPhones + s.androidNotEngravedPhones}
              />
            </StatCard>

            <StatCard title="iOS vs Android — Engraved Phones" loading={loading}>
              <CompareBar
                labelA="iOS"
                colorA="#f09e2a"
                countA={s.iosEngravedPhones}
                labelB="Android"
                colorB="#1faf56"
                countB={s.androidEngravedPhones}
              />
            </StatCard>

            <StatCard title="iOS vs Android — Not Engraved Phones" loading={loading}>
              <CompareBar
                labelA="iOS"
                colorA="#f09e2a"
                countA={s.iosNotEngravedPhones}
                labelB="Android"
                colorB="#1faf56"
                countB={s.androidNotEngravedPhones}
              />
            </StatCard>
          </div>

          <div style={overviewRow}>

            <StatCard title="Engraved Tablets" loading={loading}>
              <CompareBar
                labelA="Engraved"
                colorA="#227d27"
                countA={s.tabletsEngraved}
                labelB="Not engraved"
                colorB="#a10707"
                countB={s.tabletsNotEngraved}
              />
            </StatCard>

            <StatCard title="iOS vs Android — Tablets" loading={loading}>
              <CompareBar
                labelA="iPadOS"
                colorA="#f09e2a"
                countA={s.ipadosEngravedTablets + s.ipadosNotEngravedTablets}
                labelB="Android"
                colorB="#1faf56"
                countB={s.androidEngravedTablets + s.androidNotEngravedTablets}
              />
            </StatCard>

            <StatCard title="iPadOS vs Android — Engraved Tablets" loading={loading}>
              <CompareBar
                labelA="iPadOS"
                colorA="#f09e2a"
                countA={s.ipadosEngravedTablets}
                labelB="Android"
                colorB="#1faf56"
                countB={s.androidEngravedTablets}
              />
            </StatCard>

            <StatCard title="iPadOS vs Android — Not Engraved Tablets" loading={loading}>
              <CompareBar
                labelA="iPadOS"
                colorA="#f09e2a"
                countA={s.ipadosNotEngravedTablets}
                labelB="Android"
                colorB="#1faf56"
                countB={s.androidNotEngravedTablets}
              />
            </StatCard>
          </div>

        </div>
      )}

      {activeTab === 'devices' && (
        <StockPage embedded />
      )}

      {activeTab === 'count' && (
        <CountPage embedded />
      )}

      {activeTab === 'report' && (
        <div style={body}>
          <h2 style={heading}>Real-Time Status Report</h2>
          <p style={{ color: '#666', marginBottom: '1.75rem' }}>Device stock breakdown by RFD status and type.</p>
          {loading ? (
            <div style={muted}>Loading…</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'auto', display: 'inline-block', minWidth: 480 }}>
              <table style={rptTable}>
                <thead>
                  <tr>
                    <th style={rptThMain} rowSpan={2}>Device Type</th>
                    <th style={{ ...rptThMain, background: '#1a237e', color: '#fff', borderLeft: '3px solid #e8eaf6' }}>RFD</th>
                    <th style={{ ...rptThMain, background: '#37474f', color: '#fff', borderLeft: '3px solid #eceff1' }}>Non-RFD</th>
                    <th style={{ ...rptThMain, background: '#4a4a4a', color: '#fff', borderLeft: '3px solid #dde3ed' }} rowSpan={2}>Total</th>
                  </tr>
                  <tr>
                    <th style={{ ...rptThSub, background: '#e8eaf6', color: '#1a237e', borderLeft: '3px solid #e8eaf6' }}>Stock</th>
                    <th style={{ ...rptThSub, background: '#eceff1', color: '#37474f', borderLeft: '3px solid #eceff1' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const isAppleBrand = (b: string) => b.trim().toLowerCase() === 'apple'
                    const phones = devices.filter(d => d.device_type === 'phone' && !d.is_distributed)
                    const tablets = devices.filter(d => d.device_type === 'tablet' && !d.is_distributed)

                    const rows = [
                      { label: 'SP Android', rfd: phones.filter(d => d.is_engraved && !isAppleBrand(d.brand)).length, nonRfd: phones.filter(d => !d.is_engraved && !isAppleBrand(d.brand)).length },
                      { label: 'SP iOS',     rfd: phones.filter(d => d.is_engraved && isAppleBrand(d.brand)).length,  nonRfd: phones.filter(d => !d.is_engraved && isAppleBrand(d.brand)).length },
                      { label: 'Tab Android',  rfd: tablets.filter(d => d.is_engraved && !isAppleBrand(d.brand)).length, nonRfd: tablets.filter(d => !d.is_engraved && !isAppleBrand(d.brand)).length },
                      { label: 'Tab iPadOS',   rfd: tablets.filter(d => d.is_engraved && isAppleBrand(d.brand)).length,  nonRfd: tablets.filter(d => !d.is_engraved && isAppleBrand(d.brand)).length },
                    ].map(r => ({ ...r, total: r.rfd + r.nonRfd }))

                    const totals = rows.reduce((acc, r) => ({ rfd: acc.rfd + r.rfd, nonRfd: acc.nonRfd + r.nonRfd, total: acc.total + r.total }), { rfd: 0, nonRfd: 0, total: 0 })

                    return (
                      <>
                        {rows.map((r, i) => (
                          <tr key={r.label} style={{ background: i % 2 === 0 ? '#fafbff' : '#fff' }}>
                            <td style={rptTdLabel}>{r.label}</td>
                            <td style={{ ...rptTd, borderLeft: '3px solid #e8eaf6' }}>{r.rfd}</td>
                            <td style={{ ...rptTd, borderLeft: '3px solid #eceff1' }}>{r.nonRfd}</td>
                            <td style={{ ...rptTd, borderLeft: '3px solid #dde3ed', fontWeight: 700, color: '#1a237e' }}>{r.total}</td>
                          </tr>
                        ))}
                        <tr style={{ background: '#e8eaf6' }}>
                          <td style={{ ...rptTdLabel, fontWeight: 700, color: '#1a237e' }}>Total</td>
                          <td style={{ ...rptTd, borderLeft: '3px solid #e8eaf6', fontWeight: 700 }}>{totals.rfd}</td>
                          <td style={{ ...rptTd, borderLeft: '3px solid #eceff1', fontWeight: 700 }}>{totals.nonRfd}</td>
                          <td style={{ ...rptTd, borderLeft: '3px solid #dde3ed', fontWeight: 800, color: '#1a237e', fontSize: '1rem' }}>{totals.total}</td>
                        </tr>
                      </>
                    )
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const page: React.CSSProperties = { minHeight: '100vh', background: '#f0f4f8' }
const nav: React.CSSProperties = { background: '#1a237e', padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const brand: React.CSSProperties = { color: '#fff', fontWeight: 700, fontSize: '1.2rem', fontFamily: 'Fira Sans'}
const divider: React.CSSProperties = { width: 1, height: 20, background: 'rgba(255,255,255,0.3)' }
const userName: React.CSSProperties = { fontFamily: 'Fira Sans', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }
const navBtn: React.CSSProperties = { fontFamily: 'Fira Sans', background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: 6, padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.9rem' }

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
  fontFamily: 'Fira Sans'
})

const body: React.CSSProperties = { padding: '2rem', fontFamily: 'Fira Sans' }
const heading: React.CSSProperties = { fontWeight: 700, color: '#1a237e', marginBottom: '0.25rem', fontSize: '1.3rem' }
const sectionHeading: React.CSSProperties = { fontWeight: 700, color: '#1a237e', fontSize: '1rem', margin: '2rem 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }

const statCard: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: '1.25rem 1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', fontFamily: 'Fira Sans' }
const statCardTitle: React.CSSProperties = { fontWeight: 700, fontSize: '0.88rem', color: '#555', letterSpacing: '0.05em', marginBottom: '1rem' }

const barTrack: React.CSSProperties = { display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: '#f0f2f7' }
const barFill: React.CSSProperties = { height: '100%' }
const dot: React.CSSProperties = { display: 'inline-block', width: 9, height: 9, borderRadius: '50%', flexShrink: 0 }
const barLabel: React.CSSProperties = { fontSize: '0.8rem', color: '#555', fontWeight: 600 }
const countBadge: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 700, borderRadius: 20, padding: '0.05rem 0.5rem' }
const pctLabel: React.CSSProperties = { fontSize: '0.72rem', color: '#aaa' }
const muted: React.CSSProperties = { color: '#bbb', fontSize: '0.88rem', padding: '1rem 0' }

const fullRow = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  marginBottom: '1.25rem',
}

const overviewRow = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1.25rem',
  marginBottom: '1.25rem',
}

const rptTable: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }
const rptThMain: React.CSSProperties = { padding: '0.75rem 1.25rem', textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f0f2f7', color: '#444', borderBottom: '2px solid #dde3ed' }
const rptThSub: React.CSSProperties = { padding: '0.55rem 1.25rem', textAlign: 'center', fontWeight: 600, fontSize: '0.78rem', borderBottom: '2px solid #dde3ed' }
const rptTdLabel: React.CSSProperties = { padding: '0.75rem 1.25rem', fontWeight: 600, color: '#333', fontSize: '0.88rem', borderBottom: '1px solid #f0f2f7', whiteSpace: 'nowrap' }
const rptTd: React.CSSProperties = { padding: '0.75rem 1.25rem', textAlign: 'center', color: '#333', fontSize: '0.9rem', borderBottom: '1px solid #f0f2f7' }