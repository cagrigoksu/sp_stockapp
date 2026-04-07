import { useState, useEffect, useCallback, useRef } from 'react'
import client from '../api/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Device {
  id: number
  internal_barcode: string
  device_type: 'phone' | 'tablet'
  brand: string
  model: string
  connector: 'USB-C' | 'micro-USB' | 'lightning'
  is_engraved: number
  status: 'Good' | 'Broken'
  place: string
  creator?: string
  updater?: string
}

interface Charger {
  id: number
  barcode: string
  charger_type: 'USB-A' | 'USB-C' | 'USB-C+USB-A'
  place: string
  creator?: string
}

interface Cable {
  id: number
  barcode: string
  cable_type: 'USB-C to USB-C' | 'USB-A to USB-C' | 'USB-C to Lightning' | 'USB-A to Lightning' | 'USB-A to micro-USB'
  place: string
  creator?: string
}

const DEVICE_TYPES = ['phone', 'tablet'] as const
const CONNECTORS = ['USB-C', 'micro-USB', 'lightning'] as const
const CHARGER_TYPES = ['USB-A', 'USB-C', 'USB-C+USB-A'] as const
const CABLE_TYPES = ['USB-C to USB-C', 'USB-A to USB-C', 'USB-C to Lightning', 'USB-A to Lightning', 'USB-A to micro-USB'] as const
const STATUSES = ['Good', 'Broken'] as const

type CsvImportType = 'device' | 'charger' | 'cable'

const CSV_COLUMN_INFO: Record<CsvImportType, string> = {
  device: 'internal_barcode (optional), device_type, brand, model, connector, is_engraved, status, place',
  charger: 'barcode, charger_type, place',
  cable: 'barcode, cable_type, place',
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={ms.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={ms.modal}>
        <div style={ms.header}>
          <span style={ms.title}>{title}</span>
          <button style={ms.close} onClick={onClose}>✕</button>
        </div>
        <div style={ms.body}>{children}</div>
      </div>
    </div>
  )
}

const ms: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.5rem', borderBottom: '1px solid #e8ecf2' },
  title: { fontWeight: 700, fontSize: '1.05rem', color: '#1a237e' },
  close: { background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#888', lineHeight: 1, padding: '0.2rem 0.4rem', borderRadius: 6 },
  body: { padding: '1.5rem', overflowY: 'auto' },
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#555', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.6rem 0.85rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }
const selectStyle: React.CSSProperties = { ...inputStyle, background: '#fff', cursor: 'pointer' }

// ─── CSV Import Modal ─────────────────────────────────────────────────────────

interface CsvResult {
  imported: number
  errors?: string[]
}

function CsvImportModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [importType, setImportType] = useState<CsvImportType>('device')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CsvResult | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = async () => {
    if (!file) { setError('Please select a CSV file.'); return }
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', importType)
      const res = await client.post('/api/upload-csv', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
      onSaved()
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFile(null)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Import failed. Check your CSV and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (t: CsvImportType) => {
    setImportType(t)
    setResult(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setFile(null)
  }

  return (
    <Modal title="📤 CSV Import" onClose={onClose}>
      <Field label="Import Type">
        <select
          style={selectStyle}
          value={importType}
          onChange={e => handleTypeChange(e.target.value as CsvImportType)}
        >
          <option value="device">Devices (Phone / Tablet)</option>
          <option value="charger">Chargers</option>
          <option value="cable">Cables</option>
        </select>
      </Field>

      {/* Template download links */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
        {(['device', 'charger', 'cable'] as CsvImportType[]).map(t => (
          <a
            key={t}
            href={`/api/csv-template/${t}`}
            download
            style={btnTemplate}
          >
            ⬇ {t.charAt(0).toUpperCase() + t.slice(1)} Template
          </a>
        ))}
      </div>

      {/* Column hint */}
      <div style={hintBox}>
        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1a237e' }}>
          {importType.charAt(0).toUpperCase() + importType.slice(1)} CSV columns:
        </span>
        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', marginTop: 4, color: '#444' }}>
          {CSV_COLUMN_INFO[importType]}
        </div>
        {importType === 'device' && (
          <div style={{ fontSize: '0.76rem', color: '#666', marginTop: 4 }}>
            ↳ <code>internal_barcode</code> is optional — leave blank to auto-generate (format: YYMMDDXN).
          </div>
        )}
      </div>

      <Field label="CSV File">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ ...inputStyle, padding: '0.45rem 0.7rem', cursor: 'pointer' }}
          onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); setError('') }}
        />
      </Field>

      {error && <div style={errStyle}>{error}</div>}

      {result && (
        <div>
          <div style={successBox}>
            ✅ Imported <strong>{result.imported}</strong> record{result.imported !== 1 ? 's' : ''} successfully.
          </div>
          {result.errors && result.errors.length > 0 && (
            <div style={warningBox}>
              <strong>Rows skipped ({result.errors.length}):</strong>
              <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', fontSize: '0.8rem' }}>
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
        <button style={btnPrimary} onClick={handleImport} disabled={loading || !file}>
          {loading ? 'Importing…' : 'Import CSV'}
        </button>
        <button style={btnSecondary} onClick={onClose}>Close</button>
      </div>
    </Modal>
  )
}

// ─── Device Modals ────────────────────────────────────────────────────────────

function DeviceAddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ device_type: 'phone', brand: '', model: '', connector: 'USB-C', is_engraved: false, status: 'Good', place: '', count: '1', bulk: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    if (!form.brand.trim() || !form.model.trim()) { setError('Brand and model are required.'); return }
    setLoading(true)
    try {
      if (form.bulk && parseInt(form.count) > 1) {
        await client.post('/api/device/bulk', { ...form, count: parseInt(form.count), is_engraved: form.is_engraved ? 1 : 0 })
      } else {
        await client.post('/api/device', { ...form, is_engraved: form.is_engraved ? 1 : 0 })
      }
      onSaved(); onClose()
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to add device.')
    } finally { setLoading(false) }
  }

  return (
    <Modal title="Add Device" onClose={onClose}>
      {error && <div style={errStyle}>{error}</div>}
      <Field label="Type">
        <select style={selectStyle} value={form.device_type} onChange={e => set('device_type', e.target.value)}>
          {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </Field>
      <Field label="Brand"><input style={inputStyle} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Apple, Samsung" /></Field>
      <Field label="Model"><input style={inputStyle} value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. iPhone 14" /></Field>
      <Field label="Connector">
        <select style={selectStyle} value={form.connector} onChange={e => set('connector', e.target.value)}>
          {CONNECTORS.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Status">
        <select style={selectStyle} value={form.status} onChange={e => set('status', e.target.value)}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Place / Location"><input style={inputStyle} value={form.place} onChange={e => set('place', e.target.value)} placeholder="e.g. Shelf A3" /></Field>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={form.is_engraved} onChange={e => set('is_engraved', e.target.checked)} /> Engraved
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={form.bulk} onChange={e => set('bulk', e.target.checked)} /> Bulk add
        </label>
      </div>
      {form.bulk && (
        <Field label="Count"><input style={inputStyle} type="number" min={1} max={500} value={form.count} onChange={e => set('count', e.target.value)} /></Field>
      )}
      <button style={btnPrimary} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving…' : form.bulk ? `Add ${form.count} Devices` : 'Add Device'}
      </button>
    </Modal>
  )
}

function DeviceEditModal({ device, onClose, onSaved }: { device: Device; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ brand: device.brand, model: device.model, connector: device.connector, is_engraved: !!device.is_engraved, status: device.status, place: device.place || '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await client.put(`/api/device/${device.id}`, { ...form, is_engraved: form.is_engraved ? 1 : 0 })
      onSaved(); onClose()
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to update.')
    } finally { setLoading(false) }
  }

  return (
    <Modal title={`Edit · ${device.internal_barcode}`} onClose={onClose}>
      {error && <div style={errStyle}>{error}</div>}
      <Field label="Brand"><input style={inputStyle} value={form.brand} onChange={e => set('brand', e.target.value)} /></Field>
      <Field label="Model"><input style={inputStyle} value={form.model} onChange={e => set('model', e.target.value)} /></Field>
      <Field label="Connector">
        <select style={selectStyle} value={form.connector} onChange={e => set('connector', e.target.value)}>
          {CONNECTORS.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Status">
        <select style={selectStyle} value={form.status} onChange={e => set('status', e.target.value)}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Place"><input style={inputStyle} value={form.place} onChange={e => set('place', e.target.value)} /></Field>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}>
        <input type="checkbox" checked={form.is_engraved} onChange={e => set('is_engraved', e.target.checked)} /> Engraved
      </label>
      <button style={btnPrimary} onClick={handleSubmit} disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
    </Modal>
  )
}

function DevicesTab({ onCsvImport }: { onCsvImport: () => void }) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editDevice, setEditDevice] = useState<Device | null>(null)
  const [filters, setFilters] = useState({ barcode: '', type: '', brand: '', model: '', connector: '', status: '', place: '' })
  const setFilter = (k: string, v: string) => setFilters(f => ({ ...f, [k]: v }))

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      const res = await client.get('/api/stock', { params })
      setDevices(res.data.devices)
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchDevices() }, [fetchDevices])

  const handleDelete = async (id: number, barcode: string) => {
    if (!confirm(`Delete device ${barcode}?`)) return
    await client.delete(`/api/device/${id}`)
    fetchDevices()
  }

  return (
    <div>
      {showAdd && <DeviceAddModal onClose={() => setShowAdd(false)} onSaved={fetchDevices} />}
      {editDevice && <DeviceEditModal device={editDevice} onClose={() => setEditDevice(null)} onSaved={fetchDevices} />}
      <div style={toolbar}>
        <div style={filterRow}>
          <input style={filterInput} placeholder="Barcode" value={filters.barcode} onChange={e => setFilter('barcode', e.target.value)} />
          <select style={filterInput} value={filters.type} onChange={e => setFilter('type', e.target.value)}>
            <option value="">All types</option>
            {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input style={filterInput} placeholder="Brand" value={filters.brand} onChange={e => setFilter('brand', e.target.value)} />
          <input style={filterInput} placeholder="Model" value={filters.model} onChange={e => setFilter('model', e.target.value)} />
          <select style={filterInput} value={filters.connector} onChange={e => setFilter('connector', e.target.value)}>
            <option value="">All connectors</option>
            {CONNECTORS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select style={filterInput} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <input style={filterInput} placeholder="Place" value={filters.place} onChange={e => setFilter('place', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnSecondary} onClick={onCsvImport}>📤 Import CSV</button>
          <button style={btnPrimary} onClick={() => setShowAdd(true)}>+ Add Device</button>
        </div>
      </div>
      <div style={tableWrap}>
        {loading ? <div style={emptyMsg}>Loading…</div> : devices.length === 0 ? <div style={emptyMsg}>No devices found.</div> : (
          <table style={tbl}>
            <thead><tr>{['Barcode', 'Type', 'Brand', 'Model', 'Connector', 'Engraved', 'Status', 'Place', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {devices.map(d => (
                <tr key={d.id} style={tr}>
                  <td style={td}><code style={code}>{d.internal_barcode}</code></td>
                  <td style={td}><span style={badge(d.device_type === 'phone' ? '#e3f2fd' : '#f3e5f5', d.device_type === 'phone' ? '#1565c0' : '#6a1b9a')}>{d.device_type}</span></td>
                  <td style={td}>{d.brand}</td>
                  <td style={td}>{d.model}</td>
                  <td style={td}>{d.connector}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{d.is_engraved ? '✓' : '—'}</td>
                  <td style={td}><span style={badge(d.status === 'Good' ? '#e8f5e9' : '#fdecea', d.status === 'Good' ? '#2e7d32' : '#c62828')}>{d.status}</span></td>
                  <td style={td}>{d.place || '—'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={btnEdit} onClick={() => setEditDevice(d)}>Edit</button>
                      <button style={btnDel} onClick={() => handleDelete(d.id, d.internal_barcode)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div style={countLine}>{devices.length} device{devices.length !== 1 ? 's' : ''}</div>
    </div>
  )
}

// ─── Charger Modals ───────────────────────────────────────────────────────────

function ChargerAddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ charger_type: 'USB-A', barcode: '', place: '', count: '1' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await client.post('/api/charger', { ...form, count: parseInt(form.count) })
      onSaved(); onClose()
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to add charger.')
    } finally { setLoading(false) }
  }

  return (
    <Modal title="Add Charger(s)" onClose={onClose}>
      {error && <div style={errStyle}>{error}</div>}
      <Field label="Type">
        <select style={selectStyle} value={form.charger_type} onChange={e => set('charger_type', e.target.value)}>
          {CHARGER_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Barcode (optional)"><input style={inputStyle} value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="Optional" /></Field>
      <Field label="Place / Location"><input style={inputStyle} value={form.place} onChange={e => set('place', e.target.value)} placeholder="e.g. Box B2" /></Field>
      <Field label="Count"><input style={inputStyle} type="number" min={1} max={500} value={form.count} onChange={e => set('count', e.target.value)} /></Field>
      <button style={btnPrimary} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving…' : `Add ${form.count} Charger${parseInt(form.count) > 1 ? 's' : ''}`}
      </button>
    </Modal>
  )
}

function ChargerEditModal({ charger, onClose, onSaved }: { charger: Charger; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ charger_type: charger.charger_type, barcode: charger.barcode || '', place: charger.place || '' })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    await client.put(`/api/charger/${charger.id}`, form)
    onSaved(); onClose()
  }

  return (
    <Modal title={`Edit Charger #${charger.id}`} onClose={onClose}>
      <Field label="Type">
        <select style={selectStyle} value={form.charger_type} onChange={e => set('charger_type', e.target.value)}>
          {CHARGER_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Barcode"><input style={inputStyle} value={form.barcode} onChange={e => set('barcode', e.target.value)} /></Field>
      <Field label="Place"><input style={inputStyle} value={form.place} onChange={e => set('place', e.target.value)} /></Field>
      <button style={btnPrimary} onClick={handleSubmit} disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
    </Modal>
  )
}

function ChargersTab({ onCsvImport }: { onCsvImport: () => void }) {
  const [chargers, setChargers] = useState<Charger[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editCharger, setEditCharger] = useState<Charger | null>(null)
  const [filterType, setFilterType] = useState('')
  const [filterPlace, setFilterPlace] = useState('')

  const fetchChargers = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterType) params.charger_type = filterType
      if (filterPlace) params.charger_place = filterPlace
      const res = await client.get('/api/stock', { params })
      setChargers(res.data.chargers)
    } finally { setLoading(false) }
  }, [filterType, filterPlace])

  useEffect(() => { fetchChargers() }, [fetchChargers])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this charger?')) return
    await client.delete(`/api/charger/${id}`)
    fetchChargers()
  }

  return (
    <div>
      {showAdd && <ChargerAddModal onClose={() => setShowAdd(false)} onSaved={fetchChargers} />}
      {editCharger && <ChargerEditModal charger={editCharger} onClose={() => setEditCharger(null)} onSaved={fetchChargers} />}
      <div style={toolbar}>
        <div style={filterRow}>
          <select style={filterInput} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All types</option>
            {CHARGER_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input style={filterInput} placeholder="Place" value={filterPlace} onChange={e => setFilterPlace(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnSecondary} onClick={onCsvImport}>📤 Import CSV</button>
          <button style={btnPrimary} onClick={() => setShowAdd(true)}>+ Add Charger</button>
        </div>
      </div>
      <div style={tableWrap}>
        {loading ? <div style={emptyMsg}>Loading…</div> : chargers.length === 0 ? <div style={emptyMsg}>No chargers found.</div> : (
          <table style={tbl}>
            <thead><tr>{['ID', 'Type', 'Barcode', 'Place', 'Added by', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {chargers.map(c => (
                <tr key={c.id} style={tr}>
                  <td style={td}><code style={code}>#{c.id}</code></td>
                  <td style={td}><span style={badge('#fff3e0', '#e65100')}>{c.charger_type}</span></td>
                  <td style={td}>{c.barcode || '—'}</td>
                  <td style={td}>{c.place || '—'}</td>
                  <td style={td}>{c.creator || '—'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={btnEdit} onClick={() => setEditCharger(c)}>Edit</button>
                      <button style={btnDel} onClick={() => handleDelete(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div style={countLine}>{chargers.length} charger{chargers.length !== 1 ? 's' : ''}</div>
    </div>
  )
}

// ─── Cable Modals ─────────────────────────────────────────────────────────────

function CableAddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ cable_type: 'USB-C to USB-C', barcode: '', place: '', count: '1' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await client.post('/api/cable', { ...form, count: parseInt(form.count) })
      onSaved(); onClose()
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to add cable.')
    } finally { setLoading(false) }
  }

  return (
    <Modal title="Add Cable(s)" onClose={onClose}>
      {error && <div style={errStyle}>{error}</div>}
      <Field label="Type">
        <select style={selectStyle} value={form.cable_type} onChange={e => set('cable_type', e.target.value)}>
          {CABLE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Barcode (optional)"><input style={inputStyle} value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="Optional" /></Field>
      <Field label="Place / Location"><input style={inputStyle} value={form.place} onChange={e => set('place', e.target.value)} placeholder="e.g. Drawer C1" /></Field>
      <Field label="Count"><input style={inputStyle} type="number" min={1} max={500} value={form.count} onChange={e => set('count', e.target.value)} /></Field>
      <button style={btnPrimary} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving…' : `Add ${form.count} Cable${parseInt(form.count) > 1 ? 's' : ''}`}
      </button>
    </Modal>
  )
}

function CableEditModal({ cable, onClose, onSaved }: { cable: Cable; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ cable_type: cable.cable_type, barcode: cable.barcode || '', place: cable.place || '' })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    await client.put(`/api/cable/${cable.id}`, form)
    onSaved(); onClose()
  }

  return (
    <Modal title={`Edit Cable #${cable.id}`} onClose={onClose}>
      <Field label="Type">
        <select style={selectStyle} value={form.cable_type} onChange={e => set('cable_type', e.target.value)}>
          {CABLE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Barcode"><input style={inputStyle} value={form.barcode} onChange={e => set('barcode', e.target.value)} /></Field>
      <Field label="Place"><input style={inputStyle} value={form.place} onChange={e => set('place', e.target.value)} /></Field>
      <button style={btnPrimary} onClick={handleSubmit} disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
    </Modal>
  )
}

function CablesTab({ onCsvImport }: { onCsvImport: () => void }) {
  const [cables, setCables] = useState<Cable[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editCable, setEditCable] = useState<Cable | null>(null)
  const [filterType, setFilterType] = useState('')
  const [filterPlace, setFilterPlace] = useState('')

  const fetchCables = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterType) params.cable_type = filterType
      if (filterPlace) params.cable_place = filterPlace
      const res = await client.get('/api/stock', { params })
      setCables(res.data.cables)
    } finally { setLoading(false) }
  }, [filterType, filterPlace])

  useEffect(() => { fetchCables() }, [fetchCables])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this cable?')) return
    await client.delete(`/api/cable/${id}`)
    fetchCables()
  }

  const cableColor = (type: string) => {
    if (type.includes('Lightning')) return { bg: '#fce4ec', fg: '#880e4f' }
    if (type.includes('USB-C to USB-C')) return { bg: '#e8eaf6', fg: '#283593' }
    if (type.includes('micro-USB')) return { bg: '#f3e5f5', fg: '#4a148c' }
    return { bg: '#e0f2f1', fg: '#004d40' }
  }

  return (
    <div>
      {showAdd && <CableAddModal onClose={() => setShowAdd(false)} onSaved={fetchCables} />}
      {editCable && <CableEditModal cable={editCable} onClose={() => setEditCable(null)} onSaved={fetchCables} />}
      <div style={toolbar}>
        <div style={filterRow}>
          <select style={filterInput} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All types</option>
            {CABLE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input style={filterInput} placeholder="Place" value={filterPlace} onChange={e => setFilterPlace(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnSecondary} onClick={onCsvImport}>📤 Import CSV</button>
          <button style={btnPrimary} onClick={() => setShowAdd(true)}>+ Add Cable</button>
        </div>
      </div>
      <div style={tableWrap}>
        {loading ? <div style={emptyMsg}>Loading…</div> : cables.length === 0 ? <div style={emptyMsg}>No cables found.</div> : (
          <table style={tbl}>
            <thead><tr>{['ID', 'Type', 'Barcode', 'Place', 'Added by', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {cables.map(c => {
                const col = cableColor(c.cable_type)
                return (
                  <tr key={c.id} style={tr}>
                    <td style={td}><code style={code}>#{c.id}</code></td>
                    <td style={td}><span style={badge(col.bg, col.fg)}>{c.cable_type}</span></td>
                    <td style={td}>{c.barcode || '—'}</td>
                    <td style={td}>{c.place || '—'}</td>
                    <td style={td}>{c.creator || '—'}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={btnEdit} onClick={() => setEditCable(c)}>Edit</button>
                        <button style={btnDel} onClick={() => handleDelete(c.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <div style={countLine}>{cables.length} cable{cables.length !== 1 ? 's' : ''}</div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'devices' | 'chargers' | 'cables'

export default function StockPage({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<Tab>('devices')
  const [showCsvImport, setShowCsvImport] = useState(false)

  // Refresh trigger: passed down so CSV import can reload the active tab's data
  const [refreshKey, setRefreshKey] = useState(0)
  const handleCsvSaved = () => setRefreshKey(k => k + 1)

  return (
    <div style={page}>
      {showCsvImport && (
        <CsvImportModal
          onClose={() => setShowCsvImport(false)}
          onSaved={handleCsvSaved}
        />
      )}
      <div style={tabBar}>
        {(['devices', 'chargers', 'cables'] as Tab[]).map(t => (
          <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>
            {t === 'devices' ? '📱 Devices' : t === 'chargers' ? '🔌 Chargers' : '🔗 Cables'}
          </button>
        ))}
      </div>
      <div style={tabContent}>
        {tab === 'devices' && <DevicesTab key={`devices-${refreshKey}`} onCsvImport={() => setShowCsvImport(true)} />}
        {tab === 'chargers' && <ChargersTab key={`chargers-${refreshKey}`} onCsvImport={() => setShowCsvImport(true)} />}
        {tab === 'cables' && <CablesTab key={`cables-${refreshKey}`} onCsvImport={() => setShowCsvImport(true)} />}
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const page: React.CSSProperties = { background: '#f0f4f8', minHeight: '100%' }
const tabBar: React.CSSProperties = { display: 'flex', gap: 4, padding: '1.2rem 1.5rem 0', borderBottom: '2px solid #e0e7ef', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }
const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '0.55rem 1.2rem', border: 'none', background: active ? '#1a237e' : 'transparent',
  color: active ? '#fff' : '#555', borderRadius: '8px 8px 0 0', cursor: 'pointer',
  fontWeight: active ? 700 : 500, fontSize: '0.9rem',
  marginBottom: active ? -2 : 0, borderBottom: active ? '2px solid #1a237e' : '2px solid transparent',
})
const tabContent: React.CSSProperties = { padding: '1.5rem' }
const toolbar: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }
const filterRow: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }
const filterInput: React.CSSProperties = { padding: '0.5rem 0.75rem', border: '1.5px solid #dde3ed', borderRadius: 8, fontSize: '0.85rem', background: '#fff', outline: 'none', minWidth: 100 }
const tableWrap: React.CSSProperties = { background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'auto' }
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }
const th: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', borderBottom: '2px solid #eef0f5', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '0.7rem 1rem', borderBottom: '1px solid #f0f2f7', color: '#333', verticalAlign: 'middle' }
const tr: React.CSSProperties = {}
const emptyMsg: React.CSSProperties = { padding: '3rem', textAlign: 'center', color: '#aaa', fontSize: '0.95rem' }
const countLine: React.CSSProperties = { padding: '0.6rem 0.5rem 0', fontSize: '0.8rem', color: '#999' }
const code: React.CSSProperties = { fontFamily: 'monospace', background: '#f0f2f7', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.82rem' }
const badge = (bg: string, fg: string): React.CSSProperties => ({ background: bg, color: fg, padding: '0.2rem 0.55rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' })
const errStyle: React.CSSProperties = { background: '#fdecea', color: '#c62828', border: '1px solid #f5c6cb', borderRadius: 8, padding: '0.65rem', marginBottom: '1rem', fontSize: '0.88rem' }
const btnPrimary: React.CSSProperties = { background: '#1565c0', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.3rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }
const btnSecondary: React.CSSProperties = { background: '#fff', color: '#1565c0', border: '1.5px solid #1565c0', borderRadius: 8, padding: '0.6rem 1.1rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }
const btnEdit: React.CSSProperties = { background: '#e8f0fe', color: '#1565c0', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }
const btnDel: React.CSSProperties = { background: '#fdecea', color: '#c62828', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }
const btnTemplate: React.CSSProperties = { background: '#f5f7ff', color: '#1a237e', border: '1.5px solid #c5cae9', borderRadius: 7, padding: '0.35rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }
const hintBox: React.CSSProperties = { background: '#f0f4ff', border: '1px solid #c5cae9', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem' }
const successBox: React.CSSProperties = { background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }
const warningBox: React.CSSProperties = { background: '#fff8e1', color: '#5d4037', border: '1px solid #ffe082', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '0.5rem', fontSize: '0.85rem' }
