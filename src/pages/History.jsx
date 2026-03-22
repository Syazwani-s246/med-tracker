import { useState, useEffect, useCallback } from 'react'
import { getLogs, deleteLog, updateLog } from '../db'
import { getMergedMedications, getCourses } from '../medicationStore'
import MedCard from '../components/MedCard'
import NoteCard from '../components/NoteCard'
import Toast from '../components/Toast'
import { RiSearchLine, RiArrowDownSLine, RiArrowUpSLine } from 'react-icons/ri'
import styles from './History.module.css'

function buildCourseMarkers() {
  const meds = getMergedMedications()
  const markers = []
  for (const med of meds) {
    const courses = getCourses(med.name)
    for (const course of courses) {
      markers.push({
        id: `course-start-${course.id}`,
        type: 'course-start',
        name: med.name,
        dose: course.dose,
        timestamp: course.startDate + 'T00:00:00',
      })
      if (course.endDate) {
        markers.push({
          id: `course-end-${course.id}`,
          type: 'course-end',
          name: med.name,
          dose: course.dose,
          timestamp: course.endDate + 'T23:59:59',
        })
      }
    }
  }
  return markers
}

function groupByDate(logs) {
  const groups = {}
  for (const log of logs) {
    const key = new Date(log.timestamp).toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(log)
  }
  return groups
}

function dateLabel(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'

  const diffDays = Math.floor((today - d) / 86400000)
  if (diffDays < 7) return `${diffDays} days ago`

  return d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function entryCountLabel(logs) {
  const meds = logs.filter((l) => l.type !== 'note' && l.type !== 'course-start' && l.type !== 'course-end').length
  const notes = logs.filter((l) => l.type === 'note').length
  const parts = []
  if (meds > 0) parts.push(`${meds} med${meds !== 1 ? 's' : ''}`)
  if (notes > 0) parts.push(`${notes} note${notes !== 1 ? 's' : ''}`)
  return parts.join(', ') || '0 entries'
}

const EFFECTS = [
  { value: 'helped', label: '✅ Helped' },
  { value: 'somewhat', label: '〰️ Somewhat' },
  { value: 'none', label: "❌ Didn't Help" },
  { value: 'unknown', label: '🤔 Not sure yet' },
]

export default function History() {
  const [logs, setLogs] = useState([])
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState({})
  const [editingLog, setEditingLog] = useState(null)
  const [editEffect, setEditEffect] = useState('unknown')
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const loadLogs = useCallback(() => {
    const all = getLogs().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    setLogs(all)
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const markers = buildCourseMarkers()

  const filtered = query
    ? logs.filter((l) => {
        const q = query.toLowerCase()
        if (l.type === 'note') return (l.text || '').toLowerCase().includes(q)
        return (l.name || '').toLowerCase().includes(q)
      })
    : logs

  // Only inject markers when not searching, and only for dates that have existing log entries
  const existingDateKeys = new Set(filtered.map((l) => new Date(l.timestamp).toDateString()))
  const relevantMarkers = query
    ? []
    : markers.filter((m) => existingDateKeys.has(new Date(m.timestamp).toDateString()))

  const allEntries = [...filtered, ...relevantMarkers]
  const groups = groupByDate(allEntries)
  const sortedKeys = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a))

  function getLinkedMedName(log) {
    if (!log.linkedMedId) return null
    const med = logs.find((l) => l.id === log.linkedMedId)
    return med?.name || null
  }

  function toggleExpand(key) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleDelete(id) {
    setDeleteConfirm(id)
  }

  function confirmDelete() {
    deleteLog(deleteConfirm)
    setDeleteConfirm(null)
    loadLogs()
    setToast('Entry removed.')
  }

  function handleEdit(log) {
    setEditingLog(log)
    setEditEffect(log.effect)
  }

  function saveEdit() {
    updateLog(editingLog.id, { effect: editEffect })
    setEditingLog(null)
    loadLogs()
    setToast('Updated! 💊')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>History</h1>
        <div className={styles.searchWrap}>
          <RiSearchLine className={styles.searchIcon} />
          <input
            className={styles.search}
            type="text"
            placeholder="Search entries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      {sortedKeys.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>📋</div>
          <p>{query ? 'No results found.' : 'No history yet.'}</p>
        </div>
      ) : (
        <div className={styles.groups}>
          {sortedKeys.map((key) => {
            const dayLogs = groups[key].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            const isOpen = expanded[key] !== false // default open
            return (
              <div key={key} className={styles.group}>
                <button
                  className={styles.groupHeader}
                  onClick={() => toggleExpand(key)}
                >
                  <div>
                    <span className={styles.groupDate}>{dateLabel(key)}</span>
                    <span className={styles.groupCount}>{entryCountLabel(dayLogs)}</span>
                  </div>
                  {isOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                </button>
                {isOpen && (
                  <div className={styles.groupEntries}>
                    {dayLogs.map((log) => {
                      if (log.type === 'course-start' || log.type === 'course-end') {
                        return (
                          <div key={log.id} className={styles.courseMarker}>
                            <span className={styles.courseMarkerDot} />
                            <span className={styles.courseMarkerText}>
                              {log.type === 'course-start'
                                ? `Started ${log.name}${log.dose ? ` ${log.dose}` : ''}`
                                : `Stopped ${log.name}${log.dose ? ` ${log.dose}` : ''}`}
                            </span>
                          </div>
                        )
                      }
                      if (log.type === 'note') {
                        return (
                          <NoteCard
                            key={log.id}
                            log={log}
                            linkedMedName={getLinkedMedName(log)}
                            onDelete={handleDelete}
                          />
                        )
                      }
                      return (
                        <MedCard
                          key={log.id}
                          log={log}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      {editingLog && (
        <div className={styles.overlay}>
          <div className={styles.editModal}>
            <h3 className={styles.editTitle}>Update effect for {editingLog.name}</h3>
            <div className={styles.editEffects}>
              {EFFECTS.map(({ value, label }) => (
                <button
                  key={value}
                  className={`${styles.effectBtn} ${editEffect === value ? styles.effectBtnActive : ''}`}
                  onClick={() => setEditEffect(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className={styles.editActions}>
              <button className={styles.cancelBtn} onClick={() => setEditingLog(null)}>Cancel</button>
              <button className={styles.saveBtn} onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className={styles.overlay}>
          <div className={styles.editModal}>
            <h3 className={styles.editTitle}>Remove this entry?</h3>
            <p className={styles.deleteMsg}>This can't be undone.</p>
            <div className={styles.editActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Keep it</button>
              <button className={`${styles.saveBtn} ${styles.deleteSaveBtn}`} onClick={confirmDelete}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
