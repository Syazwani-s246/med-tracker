import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLogsForToday, getLogs, deleteLog } from '../db'
import MedCard from '../components/MedCard'
import NoteCard from '../components/NoteCard'
import LogNoteModal from '../components/LogNoteModal'
import Toast from '../components/Toast'
import styles from './Today.module.css'

function formatHeader() {
  return new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function getLinkedMedName(log, allLogs) {
  if (!log.linkedMedId) return null
  const med = allLogs.find((l) => l.id === log.linkedMedId)
  return med?.name || null
}

export default function Today() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [allLogs, setAllLogs] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  function loadLogs() {
    const todayLogs = getLogsForToday().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    setLogs(todayLogs)
    setAllLogs(getLogs())
  }

  useEffect(() => {
    loadLogs()
  }, [])

  function handleDeleteNote(id) {
    setDeleteConfirm(id)
  }

  function confirmDelete() {
    deleteLog(deleteConfirm)
    setDeleteConfirm(null)
    loadLogs()
    setToast('Entry removed.')
  }

  function handlePickerOption(type) {
    setPickerOpen(false)
    if (type === 'med') {
      navigate('/log')
    } else if (type === 'note') {
      setShowNoteModal(true)
    } else if (type === 'symptom') {
      navigate('/log')
    }
  }

  return (
    <div className={styles.page} onClick={() => pickerOpen && setPickerOpen(false)}>
      <header className={styles.header}>
        <p className={styles.dateLabel}>{formatHeader()}</p>
        <h1 className={styles.title}>Today</h1>
      </header>

      {logs.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🌿</div>
          <p>No entries logged today.</p>
          <p className={styles.emptySubtext}>Take care of yourself!</p>
        </div>
      ) : (
        <div className={styles.list}>
          <p className={styles.count}>{logs.length} entr{logs.length !== 1 ? 'ies' : 'y'} today</p>
          {logs.map((log) =>
            log.type === 'note' ? (
              <NoteCard
                key={log.id}
                log={log}
                linkedMedName={getLinkedMedName(log, allLogs)}
                onDelete={handleDeleteNote}
              />
            ) : (
              <MedCard key={log.id} log={log} />
            )
          )}
        </div>
      )}

      {/* Log picker */}
      <div className={styles.pickerWrap} onClick={(e) => e.stopPropagation()}>
        {pickerOpen && (
          <div className={styles.pickerOptions}>
            <button className={styles.pickerOption} onClick={() => handlePickerOption('med')}>
              <span className={styles.pickerOptionIcon}>💊</span>
              <span>Med</span>
            </button>
            <button className={styles.pickerOption} onClick={() => handlePickerOption('symptom')}>
              <span className={styles.pickerOptionIcon}>🩺</span>
              <span>Symptom</span>
            </button>
            <button className={`${styles.pickerOption} ${styles.pickerOptionNote}`} onClick={() => handlePickerOption('note')}>
              <span className={styles.pickerOptionIcon}>📝</span>
              <span>Note</span>
            </button>
          </div>
        )}
        <button
          className={`${styles.fab} ${pickerOpen ? styles.fabOpen : ''}`}
          onClick={() => setPickerOpen((v) => !v)}
          aria-label="Log entry"
        >
          <span className={styles.fabIcon}>{pickerOpen ? '✕' : '+'}</span>
          {!pickerOpen && <span className={styles.fabLabel}>Log</span>}
        </button>
      </div>

      {showNoteModal && (
        <LogNoteModal
          onClose={() => setShowNoteModal(false)}
          onSaved={loadLogs}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className={styles.overlay}>
          <div className={styles.deleteModal}>
            <h3 className={styles.deleteTitle}>Remove this note?</h3>
            <p className={styles.deleteMsg}>This can't be undone.</p>
            <div className={styles.deleteActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Keep it</button>
              <button className={styles.confirmBtn} onClick={confirmDelete}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
