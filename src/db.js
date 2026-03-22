const STORAGE_KEY = 'amikubat_logs'
const DISCLAIMER_KEY = 'amikubat_disclaimer_seen'

// --- Helpers ---

function generateId() {
  return crypto.randomUUID()
}

// --- Logs ---

export function getLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

export function addLog(entry) {
  const logs = getLogs()
  const newEntry = {
    id: generateId(),
    name: entry.name || '',
    dose: entry.dose || '',
    timestamp: entry.timestamp || new Date().toISOString(),
    reason: entry.reason || '',
    effect: entry.effect || 'unknown',
    notes: entry.notes || '',
  }
  logs.push(newEntry)
  saveLogs(logs)
  return newEntry
}

export function updateLog(id, updates) {
  const logs = getLogs()
  const idx = logs.findIndex((l) => l.id === id)
  if (idx === -1) return null
  logs[idx] = { ...logs[idx], ...updates }
  saveLogs(logs)
  return logs[idx]
}

export function deleteLog(id) {
  const logs = getLogs().filter((l) => l.id !== id)
  saveLogs(logs)
}

export function getLogsForToday() {
  const today = new Date().toDateString()
  return getLogs().filter((l) => new Date(l.timestamp).toDateString() === today)
}

export function getLogsSince(daysAgo) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysAgo)
  return getLogs().filter((l) => new Date(l.timestamp) >= cutoff)
}

// --- Disclaimer ---

export function hasSeenDisclaimer() {
  return localStorage.getItem(DISCLAIMER_KEY) === 'true'
}

export function markDisclaimerSeen() {
  localStorage.setItem(DISCLAIMER_KEY, 'true')
}

// --- Import / Export ---

export function exportJSON() {
  const logs = getLogs()
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
  downloadBlob(blob, 'amikubat-export.json')
}

export function exportCSV() {
  const logs = getLogs()
  const header = 'date,time,medication,dose,reason,effect,notes'
  const rows = logs.map((l) => {
    const dt = new Date(l.timestamp)
    const date = dt.toLocaleDateString('en-MY')
    const time = dt.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
    return [date, time, q(l.name), q(l.dose), q(l.reason), q(l.effect), q(l.notes)].join(',')
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  downloadBlob(blob, 'amikubat-export.csv')
}

function q(val) {
  return `"${String(val || '').replace(/"/g, '""')}"`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function importJSON(jsonString) {
  let incoming
  try {
    incoming = JSON.parse(jsonString)
    if (!Array.isArray(incoming)) throw new Error()
  } catch {
    throw new Error('Invalid JSON format.')
  }

  const existing = getLogs()
  const existingKeys = new Set(existing.map((l) => `${l.timestamp}|${l.name}`))

  const merged = [...existing]
  let added = 0
  for (const entry of incoming) {
    const key = `${entry.timestamp}|${entry.name}`
    if (!existingKeys.has(key)) {
      merged.push({ ...entry, id: entry.id || generateId() })
      added++
    }
  }

  saveLogs(merged)
  return added
}
