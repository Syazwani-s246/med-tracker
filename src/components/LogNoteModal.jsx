import { useState, useEffect, useRef } from 'react'
import { addNote, getLogs } from '../db'
import Toast from './Toast'
import styles from './LogNoteModal.module.css'

function toLocalISOString(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LogNoteModal({ onClose, onSaved }) {
  const [text, setText] = useState('')
  const [timestamp, setTimestamp] = useState(toLocalISOString(new Date()))
  const [linkedMedId, setLinkedMedId] = useState('')
  const [recentMeds, setRecentMeds] = useState([])
  const [toast, setToast] = useState(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const medLogs = getLogs()
      .filter((l) => (l.type === 'med' || !l.type) && l.name)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
    setRecentMeds(medLogs)
  }, [])

  function handleSave() {
    addNote({
      text: text.trim(),
      timestamp: new Date(timestamp).toISOString(),
      linkedMedId,
    })
    setToast('Note saved \uD83D\uDCDD')
    setTimeout(() => {
      onSaved?.()
      onClose()
    }, 1800)
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleBackdrop}>
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <h2 className={styles.title}>New Note</h2>

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          rows={5}
        />

        <div className={styles.field}>
          <label className={styles.label}>Time</label>
          <input
            className={styles.input}
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
          />
        </div>

        {recentMeds.length > 0 && (
          <div className={styles.field}>
            <p className={styles.linkHint}>
              Could this be related to something you took recently? <span className={styles.linkHintEmoji}>(optional, just a guess is fine 💛)</span>
            </p>
            <div className={styles.chips}>
              {recentMeds.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  className={`${styles.chip} ${linkedMedId === med.id ? styles.chipActive : ''}`}
                  onClick={() => setLinkedMedId(linkedMedId === med.id ? '' : med.id)}
                >
                  {med.name} &middot; {formatTime(med.timestamp)}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className={styles.saveBtn} onClick={handleSave}>
          Save Note
        </button>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
