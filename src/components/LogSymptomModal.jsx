import { useState, useEffect, useRef } from 'react'
import { addSymptom } from '../db'
import Toast from './Toast'
import styles from './LogNoteModal.module.css'

function toLocalISOString(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const SYMPTOM_PRESETS = [
  'headache',
  'fever',
  'nausea',
  'stomachache',
  'dizziness',
  'fatigue',
  'anxiety',
  'muscle pain',
  'other',
]

export default function LogSymptomModal({ onClose, onSaved }) {
  const [selected, setSelected] = useState('')
  const [customText, setCustomText] = useState('')
  const [timestamp, setTimestamp] = useState(toLocalISOString(new Date()))
  const [toast, setToast] = useState(null)
  const customRef = useRef(null)

  useEffect(() => {
    if (selected === 'other') {
      customRef.current?.focus()
    }
  }, [selected])

  function handleSave() {
    const text = selected === 'other' ? customText.trim() : selected
    if (!text) return
    addSymptom({ text, timestamp })
    setToast('Symptom logged 🩺')
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
        <h2 className={styles.title}>Log Symptom</h2>

        <div className={styles.field}>
          <label className={styles.label}>What are you feeling?</label>
          <div className={styles.chips}>
            {SYMPTOM_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`${styles.chip} ${selected === preset ? styles.chipActive : ''}`}
                onClick={() => setSelected(selected === preset ? '' : preset)}
              >
                {preset}
              </button>
            ))}
          </div>
          {selected === 'other' && (
            <input
              ref={customRef}
              className={styles.input}
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Describe your symptom..."
            />
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Time</label>
          <input
            className={styles.input}
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
          />
        </div>

        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!selected || (selected === 'other' && !customText.trim())}
        >
          Save Symptom
        </button>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
