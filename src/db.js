import { getMergedMedications, getCourses, addCourse } from './medicationStore'

const STORAGE_KEY = 'amikubat_logs'
const DISCLAIMER_KEY = 'amikubat_disclaimer_seen'

// --- Helpers ---

function generateId() {
  return crypto.randomUUID()
}

function localISOString() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
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
    type: 'med',
    name: entry.name || '',
    dose: entry.dose || '',
    timestamp: entry.timestamp || localISOString(),
    reason: entry.reason || '',
    effect: entry.effect || 'unknown',
    notes: entry.notes || '',
  }
  logs.push(newEntry)
  saveLogs(logs)
  return newEntry
}

export function addSymptom(entry) {
  const logs = getLogs()
  const newEntry = {
    id: generateId(),
    type: 'symptom',
    timestamp: entry.timestamp || localISOString(),
    text: entry.text || '',
  }
  logs.push(newEntry)
  saveLogs(logs)
  return newEntry
}

export function addNote(entry) {
  const logs = getLogs()
  const newEntry = {
    id: generateId(),
    type: 'note',
    timestamp: entry.timestamp || localISOString(),
    text: entry.text || '',
    linkedMedId: entry.linkedMedId || '',
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
  const meds = getMergedMedications()
  const medication_courses = {}
  for (const med of meds) {
    const courses = getCourses(med.name)
    if (courses.length > 0) medication_courses[med.name] = courses
  }
  const payload = { logs, medication_courses }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  downloadBlob(blob, 'amikubat-export.json')
}

export function exportCSV() {
  const logs = getLogs()
  const header = 'date,time,type,medication,dose,reason,effect,notes,text,linkedMedId'
  const rows = logs.map((l) => {
    const dt = new Date(l.timestamp)
    const date = dt.toLocaleDateString('en-MY')
    const time = dt.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
    const type = l.type || 'med'
    if (type === 'note') {
      return [date, time, q('note'), q(''), q(''), q(''), q(''), q(''), q(l.text), q(l.linkedMedId)].join(',')
    }
    return [date, time, q('med'), q(l.name), q(l.dose), q(l.reason), q(l.effect), q(l.notes), q(''), q('')].join(',')
  })

  const meds = getMergedMedications()
  const courseRows = []
  for (const med of meds) {
    const courses = getCourses(med.name)
    for (const c of courses) {
      courseRows.push([q(med.name), q(c.dose), q(c.startDate), q(c.endDate || '(ongoing)'), q(c.notes || '')].join(','))
    }
  }

  let csv = [header, ...rows].join('\n')
  if (courseRows.length > 0) {
    csv += '\n\n--- Medication Courses ---\nMedication,Dose,Start Date,End Date,Notes\n' + courseRows.join('\n')
  }
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

export function seedTestLogs() {
  const pad = (n) => String(n).padStart(2, '0')
  const d = new Date()
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const existing = getLogs()
  const seeds = [
    { id: generateId(), type: 'med', name: 'Panadol', dose: '500mg', timestamp: `${base}T09:00`, reason: 'headache', effect: 'helped', notes: '' },
    { id: generateId(), type: 'med', name: 'Uphamol', dose: '500mg', timestamp: `${base}T11:00`, reason: 'fever', effect: 'somewhat', notes: '' },
  ]
  saveLogs([...existing, ...seeds])
}

export function importJSON(jsonString) {
  let parsed
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error('Invalid JSON format.')
  }

  // Support both legacy array format and new { logs, medication_courses } format
  let incoming, medication_courses
  if (Array.isArray(parsed)) {
    incoming = parsed
    medication_courses = null
  } else if (parsed && Array.isArray(parsed.logs)) {
    incoming = parsed.logs
    medication_courses = parsed.medication_courses || null
  } else {
    throw new Error('Invalid JSON format.')
  }

  const existing = getLogs()
  const dedupeKey = (l) => {
    if (l.type === 'note') return `${l.timestamp}|note|${(l.text || '').slice(0, 30)}`
    return `${l.timestamp}|${l.name || ''}`
  }
  const existingKeys = new Set(existing.map(dedupeKey))

  const merged = [...existing]
  let added = 0
  for (const entry of incoming) {
    const key = dedupeKey(entry)
    if (!existingKeys.has(key)) {
      merged.push({ ...entry, id: entry.id || generateId() })
      added++
    }
  }
  saveLogs(merged)

  // Restore courses if present
  if (medication_courses && typeof medication_courses === 'object') {
    for (const [medName, courses] of Object.entries(medication_courses)) {
      if (!Array.isArray(courses)) continue
      const existing = getCourses(medName)
      const existingIds = new Set(existing.map((c) => c.id))
      for (const course of courses) {
        if (!existingIds.has(course.id)) {
          addCourse(medName, course)
        }
      }
    }
  }

  return added
}
