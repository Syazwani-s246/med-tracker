import { useState, useEffect, useCallback } from 'react'
import { getLogs, deleteLog, updateLog } from '../db'
import MedCard from '../components/MedCard'
import NoteCard from '../components/NoteCard'
import Toast from '../components/Toast'
import { RiSearchLine, RiArrowDownSLine, RiArrowUpSLine } from 'react-icons/ri'
import styles from './History.module.css'

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
  const meds = logs.filter((l) => l.type !== 'note').length
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

  const filtered = query
    ? logs.filter((l) => {
        const q = query.toLowerCase()
        if (l.type === 'note') return (l.text || '').toLowerCase().includes(q)
        return (l.name || '').toLowerCase().includes(q)
      })
    : logs

  const groups = groupByDate(filtered)
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
                    {dayLogs.map((log) =>
                      log.type === 'note' ? (
                        <NoteCard
                          key={log.id}
                          log={log}
                          linkedMedName={getLinkedMedName(log)}
                          onDelete={handleDelete}
                        />
                      ) : (
                        <MedCard
                          key={log.id}
                          log={log}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      )
                    )}
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
