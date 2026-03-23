import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addLog, getLogs } from '../db'
import { REASON_PRESETS } from '../medications'
import { searchMedications, getSafetyInterval, getIngredients } from '../medicationStore'
import SafetyModal from '../components/SafetyModal'
import IngredientModal from '../components/IngredientModal'
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
  const [ingredientData, setIngredientData] = useState(null)
  const [toast, setToast] = useState(null)
  const nameRef = useRef(null)
  const navigateTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current)
    }
  }, [])

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

  function checkIngredients() {
    const myIngredients = getIngredients(name.trim())
    if (!myIngredients.length) return []

    const now = new Date(timestamp)
    const cutoff = new Date(now)
    cutoff.setHours(cutoff.getHours() - 8)

    const recentLogs = getLogs().filter(
      (l) =>
        l.type !== 'note' &&
        l.name.toLowerCase() !== name.trim().toLowerCase() &&
        new Date(l.timestamp) >= cutoff &&
        new Date(l.timestamp) <= now
    )

    const overlaps = []
    for (const log of recentLogs) {
      const theirIngredients = getIngredients(log.name)
      const shared = myIngredients.filter((i) => theirIngredients.includes(i))
      if (shared.length > 0 && !overlaps.find((o) => o.medName.toLowerCase() === log.name.toLowerCase())) {
        overlaps.push({
          medName: log.name,
          sharedIngredients: shared,
          hoursSince: (now - new Date(log.timestamp)) / 3600000,
        })
      }
    }
    return overlaps
  }

  function runIngredientCheck() {
    const overlaps = checkIngredients()
    if (overlaps.length > 0) {
      setIngredientData(overlaps)
    } else {
      doSave()
    }
  }

  function resetForm() {
    setName('')
    setDose('')
    setTimestamp(toLocalISOString(new Date()))
    setReason('')
    setCustomReason('')
    setEffect('unknown')
    setSuggestions([])
    setShowSuggestions(false)
    setSafetyData(null)
    setIngredientData(null)
  }

  function doSave() {
    try {
      const finalReason = reason === 'other' ? customReason : reason
      addLog({
        name: name.trim(),
        dose: dose.trim(),
        timestamp,
        reason: finalReason,
        effect,
      })
      resetForm()
      setToast('Logged! 💊')
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current)
      navigateTimerRef.current = setTimeout(() => navigate('/today'), 2500)
    } catch {
      setToast('Could not save — please try again.')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    if (navigateTimerRef.current) {
      clearTimeout(navigateTimerRef.current)
      navigateTimerRef.current = null
    }
    try {
      const safe = checkSafety()
      if (safe) {
        runIngredientCheck()
      }
    } catch {
      setToast('Something went wrong — please try again.')
    }
  }

  function handleSafetyContinue() {
    setSafetyData(null)
    runIngredientCheck()
  }

  function handleSafetyWait() {
    setSafetyData(null)
  }

  function handleIngredientContinue() {
    setIngredientData(null)
    doSave()
  }

  function handleIngredientWait() {
    setIngredientData(null)
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

      {ingredientData && (
        <IngredientModal
          newMed={name}
          overlaps={ingredientData}
          onContinue={handleIngredientContinue}
          onWait={handleIngredientWait}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
