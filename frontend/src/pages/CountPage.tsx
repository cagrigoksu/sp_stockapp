import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Session {
  id: number
  name: string
  notes?: string
  created_at?: string
  creator_name?: string
  completed_at?: string | null
}

interface ValidateResult {
  found: boolean
  type?: 'device' | 'charger' | 'cable'
  item?: any
}

// ─── New Session Modal ────────────────────────────────────────────────────────

function NewSessionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) { setError('Session name is required.'); return }
    setError('')
    setLoading(true)
    try {
      await client.post('/api/count/sessions', { name: name.trim(), notes })
      onCreated()
      onClose()
    } catch {
      setError('Failed to create session.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalBox}>
        <div style={modalHeader}>
          <span style={modalTitle}>New Count Session</span>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={modalBody}>
          {error && <div style={errBox}>{error}</div>}
          <div style={fieldWrap}>
            <label style={labelStyle}>Session Name *</label>
            <input
              style={inputStyle}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Monthly Count Jan 2026"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              style={{ ...inputStyle, height: 72, resize: 'vertical' } as React.CSSProperties}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes…"
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button style={btnPrimary} onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating…' : 'Create Session'}
            </button>
            <button style={btnSecondary} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onComplete }: { session: Session; onComplete: (id: number) => void }) {
  const done = !!session.completed_at
  return (
    <div style={{ ...sessionCard, opacity: done ? 0.65 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a237e', marginBottom: 2 }}>
            {session.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>
            {session.created_at?.slice(0, 16) || ''}
            {session.creator_name ? ` · ${session.creator_name}` : ''}
          </div>
          {session.notes && (
            <div style={{ fontSize: '0.73rem', color: '#999', marginTop: 2 }}>{session.notes}</div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          {done
            ? <span style={doneBadge}>Done</span>
            : <button style={completeBtn} onClick={() => onComplete(session.id)} title="Mark complete">✓</button>
          }
        </div>
      </div>
    </div>
  )
}

// ─── Scan Result ──────────────────────────────────────────────────────────────

function ScanResult({ result, barcode }: { result: ValidateResult; barcode: string }) {
  if (!result.found) {
    return (
      <div style={scanNotFound}>
        <span style={{ fontWeight: 700 }}>✗ NOT FOUND</span>
        {' — '}
        <code style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{barcode}</code>
        {' — Not in the system'}
      </div>
    )
  }

  const { type, item } = result
  let detail = ''
  if (type === 'device') {
    detail = `${item.brand} ${item.model} (${item.device_type}) · ${item.connector} · ${item.status} · ${item.place || 'no place'}`
  } else if (type === 'charger') {
    detail = `Charger: ${item.charger_type} · ${item.place || 'no place'}`
  } else {
    detail = `Cable: ${item.cable_type} · ${item.place || 'no place'}`
  }

  return (
    <div style={scanFound}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        ✓ Found{' '}
        <span style={typePill}>{type?.toUpperCase()}</span>
      </div>
      <div style={{ fontSize: '0.88rem', color: '#1b5e20' }}>{detail}</div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CountPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [showNewSession, setShowNewSession] = useState(false)

  const [barcode, setBarcode] = useState('')
  const [scanResult, setScanResult] = useState<ValidateResult | null>(null)
  const [lastBarcode, setLastBarcode] = useState('')
  const [scanLoading, setScanLoading] = useState(false)

  const barcodeInputRef = useRef<HTMLInputElement>(null)

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await client.get('/api/count/sessions')
      setSessions(res.data)
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    barcodeInputRef.current?.focus()
  }, [fetchSessions])

  const handleComplete = async (id: number) => {
    if (!confirm('Mark this session as complete?')) return
    await client.post(`/api/count/sessions/${id}/complete`)
    fetchSessions()
  }

  const handleLookup = async () => {
    const val = barcode.trim()
    if (!val) return
    setScanLoading(true)
    setScanResult(null)
    try {
      const res = await client.post('/api/count/validate', { barcode: val })
      setLastBarcode(val)
      setScanResult(res.data)
    } catch {
      setLastBarcode(val)
      setScanResult({ found: false })
    } finally {
      setScanLoading(false)
    }
  }

  const handleClear = () => {
    setBarcode('')
    setScanResult(null)
    setLastBarcode('')
    barcodeInputRef.current?.focus()
  }

  const handleLogout = async () => {
    await client.post('/api/auth/logout')
    navigate('/login')
  }

  return (
    <div style={page}>
      {/* Nav */}
      <nav style={nav}>
        <span style={brand}>StockApp</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={navBtn} onClick={() => navigate('/stock')}>📦 Stock</button>
          <button style={{ ...navBtn, background: 'rgba(255,255,255,0.15)' }}>📋 Count</button>
          <span style={navDivider} />
          <span style={navUser}>{user?.user_name}</span>
          <button style={navBtn} onClick={() => navigate('/change-password')}>Change Password</button>
          <button style={navBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {showNewSession && (
        <NewSessionModal
          onClose={() => setShowNewSession(false)}
          onCreated={fetchSessions}
        />
      )}

      <div style={body}>
        <h2 style={heading}>📋 Count &amp; Validate</h2>

        <div style={layout}>
          {/* ── Left: Sessions ── */}
          <div>
            <div style={card}>
              <div style={cardHeader}>
                <span style={cardTitle}>Count Sessions</span>
                <button style={btnPrimary} onClick={() => setShowNewSession(true)}>+ New</button>
              </div>
              {sessionsLoading ? (
                <div style={muted}>Loading…</div>
              ) : sessions.length === 0 ? (
                <div style={muted}>No sessions yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sessions.map(s => (
                    <SessionCard key={s.id} session={s} onComplete={handleComplete} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Scanner + Summary ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Scanner */}
            <div style={scannerBox}>
              <div style={scannerLabel}>Barcode Scanner / Lookup</div>
              <input
                ref={barcodeInputRef}
                style={barcodeInput}
                type="text"
                value={barcode}
                onChange={e => { setBarcode(e.target.value); setScanResult(null) }}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                placeholder="Scan or type barcode here…"
                autoComplete="off"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button style={btnLight} onClick={handleLookup} disabled={scanLoading || !barcode.trim()}>
                  {scanLoading ? 'Looking up…' : '🔍 Look Up'}
                </button>
                <button style={btnLightOutline} onClick={handleClear}>Clear</button>
              </div>
              {scanResult && (
                <div style={{ marginTop: 12 }}>
                  <ScanResult result={scanResult} barcode={lastBarcode} />
                </div>
              )}
            </div>

            {/* Quick Count Summary */}
            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a237e', marginBottom: 10 }}>
                Quick Count Summary
              </div>
              <div style={muted}>
                Use the scanner above to look up items, or create a session to start counting.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const page: React.CSSProperties = { minHeight: '100vh', background: '#f0f4f8' }

const nav: React.CSSProperties = {
  background: '#1a237e', padding: '0.75rem 2rem',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
}
const brand: React.CSSProperties = { color: '#fff', fontWeight: 700, fontSize: '1.1rem' }
const navBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.5)',
  color: '#fff', borderRadius: 6, padding: '0.3rem 0.8rem',
  cursor: 'pointer', fontSize: '0.88rem',
}
const navDivider: React.CSSProperties = { width: 1, height: 20, background: 'rgba(255,255,255,0.3)' }
const navUser: React.CSSProperties = { color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem' }

const body: React.CSSProperties = { padding: '1.75rem 2rem' }
const heading: React.CSSProperties = { fontWeight: 700, color: '#1a237e', marginBottom: '1.25rem', fontSize: '1.3rem' }

const layout: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '300px 1fr',
  gap: '1.25rem',
  alignItems: 'start',
}

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 14,
  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  padding: '1.25rem',
}
const cardHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem',
}
const cardTitle: React.CSSProperties = { fontWeight: 700, fontSize: '0.95rem', color: '#1a237e' }

const sessionCard: React.CSSProperties = {
  border: '1.5px solid #e8ecf2', borderRadius: 10,
  padding: '0.75rem 0.9rem', background: '#fafbff',
}
const doneBadge: React.CSSProperties = {
  background: '#e0e0e0', color: '#666', borderRadius: 20,
  padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 600,
}
const completeBtn: React.CSSProperties = {
  background: '#e8f5e9', color: '#2e7d32', border: 'none',
  borderRadius: 8, padding: '0.25rem 0.65rem', cursor: 'pointer',
  fontWeight: 700, fontSize: '0.9rem',
}

const scannerBox: React.CSSProperties = {
  background: '#1a237e', borderRadius: 14, padding: '1.5rem',
}
const scannerLabel: React.CSSProperties = {
  color: 'rgba(255,255,255,0.85)', fontWeight: 700,
  fontSize: '0.92rem', marginBottom: '0.9rem',
}
const barcodeInput: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#0d1b4b', border: '2px solid #4a6cf7',
  color: '#4fc3f7', fontFamily: "'Courier New', monospace",
  fontSize: '1.2rem', borderRadius: 10, textAlign: 'center',
  padding: '0.9rem 1rem', outline: 'none',
}
const btnLight: React.CSSProperties = {
  background: '#fff', color: '#1a237e', border: 'none',
  borderRadius: 8, padding: '0.45rem 1.1rem',
  fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
}
const btnLightOutline: React.CSSProperties = {
  background: 'transparent', color: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(255,255,255,0.4)',
  borderRadius: 8, padding: '0.45rem 1rem',
  fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
}
const scanFound: React.CSSProperties = {
  background: '#d4edda', border: '2px solid #28a745',
  borderRadius: 10, padding: '0.85rem 1rem', color: '#155724',
}
const scanNotFound: React.CSSProperties = {
  background: '#fde8e8', border: '2px solid #dc3545',
  borderRadius: 10, padding: '0.85rem 1rem', color: '#721c24', fontSize: '0.9rem',
}
const typePill: React.CSSProperties = {
  background: 'rgba(255,255,255,0.6)', color: '#1b5e20',
  borderRadius: 20, padding: '0.1rem 0.55rem',
  fontSize: '0.75rem', fontWeight: 700,
}
const muted: React.CSSProperties = { color: '#999', fontSize: '0.88rem' }

// Modal
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
}
const modalBox: React.CSSProperties = {
  background: '#fff', borderRadius: 14, width: '100%', maxWidth: 440,
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
}
const modalHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '1.1rem 1.5rem', borderBottom: '1px solid #e8ecf2',
}
const modalTitle: React.CSSProperties = { fontWeight: 700, fontSize: '1rem', color: '#1a237e' }
const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: '1.1rem',
  cursor: 'pointer', color: '#888', padding: '0.2rem 0.4rem', borderRadius: 6,
}
const modalBody: React.CSSProperties = { padding: '1.25rem 1.5rem 1.5rem' }
const fieldWrap: React.CSSProperties = { marginBottom: '1rem' }
const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 600, fontSize: '0.8rem',
  color: '#555', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.85rem', border: '2px solid #e0e0e0',
  borderRadius: 8, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none',
}
const errBox: React.CSSProperties = {
  background: '#fdecea', color: '#c62828', border: '1px solid #f5c6cb',
  borderRadius: 8, padding: '0.6rem', marginBottom: '1rem', fontSize: '0.88rem',
}
const btnPrimary: React.CSSProperties = {
  background: '#1565c0', color: '#fff', border: 'none',
  borderRadius: 8, padding: '0.5rem 1.1rem',
  fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  background: '#fff', color: '#1565c0', border: '1.5px solid #1565c0',
  borderRadius: 8, padding: '0.5rem 1rem',
  fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
}
