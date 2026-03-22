import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addLog, getLogs } from '../db'
import { searchMedications, getSafetyInterval, REASON_PRESETS } from '../medications'
import SafetyModal from '../components/SafetyModal'
import Toast from '../components/Toast'
import styles from './LogMed.module.css'

function toLocalISOString(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const EFFECTS = [
  { value: 'helped', label: '✅ Helped' },
  { value: 'somewhat', label: '〰️ Somewhat' },
  { value: 'none', label: '❌ Didn\'t Help' },
  { value: 'unknown', label: '🤔 Not sure yet' },
]

export default function LogMed() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [timestamp, setTimestamp] = useState(toLocalISOString(new Date()))
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [effect, setEffect] = useState('unknown')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [safetyData, setSafetyData] = useState(null)
  const [pendingSave, setPendingSave] = useState(false)
  const [toast, setToast] = useState(null)
  const nameRef = useRef(null)

  useEffect(() => {
    if (name.trim()) {
      setSuggestions(searchMedications(name))
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [name])

  function checkSafety() {
    const interval = getSafetyInterval(name.trim())
    if (!interval) return true

    const recent = getLogs()
      .filter((l) => l.name.toLowerCase() === name.trim().toLowerCase())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    if (recent.length === 0) return true

    const lastTaken = new Date(recent[0].timestamp)
    const now = new Date(timestamp)
    const hoursSince = (now - lastTaken) / 3600000

    if (hoursSince < interval) {
      setSafetyData({ hoursSince, safeInterval: interval })
      return false
    }
    return true
  }

  function doSave() {
    const finalReason = reason === 'other' ? customReason : reason
    addLog({
      name: name.trim(),
      dose: dose.trim(),
      timestamp: new Date(timestamp).toISOString(),
      reason: finalReason,
      effect,
    })
    setToast('Logged! 💊')
    setTimeout(() => navigate('/today'), 2500)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const safe = checkSafety()
    if (!safe) {
      setPendingSave(true)
    } else {
      doSave()
    }
  }

  function handleSafetyContinue() {
    setSafetyData(null)
    setPendingSave(false)
    doSave()
  }

  function handleSafetyWait() {
    setSafetyData(null)
    setPendingSave(false)
  }

  function selectSuggestion(val) {
    setName(val)
    setShowSuggestions(false)
    nameRef.current?.blur()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Log Medication</h1>
        <p className={styles.subtitle}>What did you take?</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Medication name */}
        <div className={styles.field}>
          <label className={styles.label}>Medication name</label>
          <div className={styles.autocompleteWrap}>
            <input
              ref={nameRef}
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => name && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. Panadol, Ibuprofen..."
              required
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className={styles.suggestions}>
                {suggestions.slice(0, 6).map((s) => (
                  <li
                    key={s}
                    className={styles.suggestion}
                    onMouseDown={() => selectSuggestion(s)}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Dose */}
        <div className={styles.field}>
          <label className={styles.label}>Dose</label>
          <input
            className={styles.input}
            type="text"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder="e.g. 500mg, 1 tablet, 2 capsules"
          />
        </div>

        {/* Time */}
        <div className={styles.field}>
          <label className={styles.label}>Time taken</label>
          <input
            className={styles.input}
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
          />
        </div>

        {/* Reason */}
        <div className={styles.field}>
          <label className={styles.label}>Reason / symptom <span className={styles.optional}>(optional)</span></label>
          <div className={styles.chips}>
            {REASON_PRESETS.map((r) => (
              <button
                key={r}
                type="button"
                className={`${styles.chip} ${reason === r ? styles.chipActive : ''}`}
                onClick={() => setReason(reason === r ? '' : r)}
              >
                {r}
              </button>
            ))}
          </div>
          {reason === 'other' && (
            <input
              className={`${styles.input} ${styles.inputSm}`}
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Describe your symptom..."
            />
          )}
        </div>

        {/* Effect */}
        <div className={styles.field}>
          <label className={styles.label}>How did it help?</label>
          <div className={styles.effectGrid}>
            {EFFECTS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`${styles.effectBtn} ${effect === value ? styles.effectBtnActive : ''}`}
                onClick={() => setEffect(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button className={styles.submit} type="submit">
          Save Entry
        </button>
      </form>

      {safetyData && (
        <SafetyModal
          medName={name}
          hoursSince={safetyData.hoursSince}
          safeInterval={safetyData.safeInterval}
          onContinue={handleSafetyContinue}
          onWait={handleSafetyWait}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
