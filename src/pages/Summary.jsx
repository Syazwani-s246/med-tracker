import { useRef, useState, useEffect } from 'react'
import { getLogs, getLogsSince, exportJSON, exportCSV, importJSON } from '../db'
import { getMergedMedications, getCourses, getActiveCourse, getPrescribed, isWithinAnyCourse } from '../medicationStore'
import Toast from '../components/Toast'
import { RiDownloadLine, RiUploadLine } from 'react-icons/ri'
import styles from './Summary.module.css'

function formatDate(dateStr) {
  if (!dateStr) return 'Ongoing'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTimestamp(ts) {
  return new Date(ts).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}

function formatWeekOf(ts) {
  return new Date(ts).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}

function getWeekStart(ts) {
  const d = new Date(ts)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.getTime()
}

export default function Summary() {
  const [toast, setToast] = useState(null)
  const [view, setView] = useState('week')
  const fileRef = useRef(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [view])

  const weekLogs = getLogsSince(7)
  const monthLogs = getLogsSince(30)
  const allLogs = getLogs()
  const meds = getMergedMedications()

  // --- Section 1: This Week at a Glance ---
  const medLogsWeek = weekLogs.filter((l) => l.type !== 'note' && l.type !== 'symptom')
  const medDaysWeek = new Set(medLogsWeek.map((l) => new Date(l.timestamp).toDateString()))
  const medFreeDays = 7 - medDaysWeek.size

  let medFreeMsg
  if (medFreeDays <= 1) medFreeMsg = "You've been on top of your meds this week 💊"
  else if (medFreeDays <= 4) medFreeMsg = "A mixed week — some days with meds, some without 🌿"
  else medFreeMsg = "Mostly med-free this week — hope you're feeling well 🌟"

  const totalEntriesWeek = weekLogs.length

  const symptomLogsWeek = weekLogs.filter((l) => l.type === 'symptom')
  const symptomCounts = symptomLogsWeek.reduce((acc, l) => {
    const text = (l.text || '').toLowerCase().trim()
    if (text && text !== 'other') acc[text] = (acc[text] || 0) + 1
    return acc
  }, {})
  const topSymptom = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0] || null

  // --- Section 2: Medication Consistency (weekly, only meds taken at least once) ---
  const medLogsMonth = monthLogs.filter((l) => l.type !== 'note' && l.type !== 'symptom')
  const medNamesMonth = new Set(medLogsMonth.map((l) => l.name))

  const relevantMeds = meds.filter((m) => {
    if (medNamesMonth.has(m.name)) return true
    return getActiveCourse(m.name) !== null
  })

  const medConsistencyData = relevantMeds
    .map((med) => {
      const prescribed = getPrescribed(med.name)
      const logs7 = medLogsWeek.filter((l) => l.name === med.name)
      const count7 = logs7.length
      const uniqueDays7 = new Set(logs7.map((l) => new Date(l.timestamp).toDateString())).size
      const isOveruse = !prescribed && count7 > 5

      let message
      if (prescribed) {
        message = uniqueDays7 >= 5
          ? `${med.name} — taken consistently 👍`
          : `${med.name} — a few missed days this week`
      } else {
        message = `${med.name} — taken ${count7} time${count7 !== 1 ? 's' : ''} this week`
      }

      return { med, prescribed, count7, isOveruse, message }
    })
    .filter((d) => d.count7 > 0)

  // --- Section 3: Effect Rates ---
  const allMedLogs = allLogs.filter((l) => l.type !== 'note' && l.type !== 'symptom')
  const effectData = []

  for (const med of meds) {
    const knownLogs = allMedLogs.filter((l) => l.name === med.name && l.effect !== 'unknown')
    if (knownLogs.length < 3) continue

    const total = knownLogs.length
    const helped = knownLogs.filter((l) => l.effect === 'helped').length
    const somewhat = knownLogs.filter((l) => l.effect === 'somewhat').length
    const none = knownLogs.filter((l) => l.effect === 'none').length
    const helpedPct = Math.round((helped / total) * 100)
    const somewhatPct = Math.round((somewhat / total) * 100)
    const nonePct = Math.round((none / total) * 100)

    effectData.push({ name: med.name, helpedPct, somewhatPct, nonePct })
  }

  // --- Section 4: Notes & Symptoms ---
  const weekNotesAndSymptoms = weekLogs
    .filter((l) => l.type === 'note' || l.type === 'symptom')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  const notesAndSymptoms = monthLogs
    .filter((l) => l.type === 'note' || l.type === 'symptom')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  const weekMap = {}
  const groupedByWeek = []
  for (const entry of notesAndSymptoms) {
    const weekStart = getWeekStart(entry.timestamp)
    if (!weekMap[weekStart]) {
      weekMap[weekStart] = []
      groupedByWeek.push({ weekStart, entries: weekMap[weekStart] })
    }
    weekMap[weekStart].push(entry)
  }
  groupedByWeek.sort((a, b) => b.weekStart - a.weekStart)

  // --- Section 5: Medication History ---
  const medsWithHistory = meds
    .map((med) => ({ name: med.name, courses: getCourses(med.name) }))
    .filter((m) => m.courses.length > 0)

  // --- Monthly view data ---

  // 1. Top symptom this month by unique days
  const symptomDayMap = {}
  for (const l of monthLogs.filter((l) => l.type === 'symptom')) {
    const text = (l.text || '').toLowerCase().trim()
    if (!text || text === 'other') continue
    const day = new Date(l.timestamp).toDateString()
    if (!symptomDayMap[text]) symptomDayMap[text] = new Set()
    symptomDayMap[text].add(day)
  }
  const topSymptomMonth = Object.entries(symptomDayMap)
    .map(([symptom, days]) => [symptom, days.size])
    .sort((a, b) => b[1] - a[1])[0] || null

  // 2. Per-medication total + avg frequency
  const monthlyMedStats = []
  for (const name of [...medNamesMonth]) {
    const logs = medLogsMonth.filter((l) => l.name === name)
    const count = logs.length
    const avgEvery = count > 1 ? Math.round(30 / count) : null
    monthlyMedStats.push({ name, count, avgEvery })
  }
  monthlyMedStats.sort((a, b) => b.count - a.count)

  // 3. Consistency tracker for meds taken 15+ times
  const consistencyMeds = monthlyMedStats
    .filter((s) => s.count >= 15)
    .map((s) => {
      const uniqueDays = new Set(
        medLogsMonth.filter((l) => l.name === s.name).map((l) => new Date(l.timestamp).toDateString())
      ).size
      const pct = Math.round((uniqueDays / 30) * 100)
      return { name: s.name, count: s.count, uniqueDays, pct }
    })

  // 4. Overuse flag: any non-prescribed med taken more than 15 times this month
  const overuseFlagged = monthlyMedStats.filter((s) => s.count > 15 && !getPrescribed(s.name))

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const added = importJSON(evt.target.result)
        setToast(`Imported ${added} new entr${added !== 1 ? 'ies' : 'y'}! 💊`)
      } catch {
        setToast('Could not import — please check the file format.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Summary</h1>
      </header>

      {/* View toggle */}
      <div className={styles.viewToggle}>
        <button
          className={`${styles.toggleBtn} ${view === 'week' ? styles.toggleBtnActive : ''}`}
          onClick={() => setView('week')}
        >
          This Week
        </button>
        <button
          className={`${styles.toggleBtn} ${view === 'month' ? styles.toggleBtnActive : ''}`}
          onClick={() => setView('month')}
        >
          This Month
        </button>
      </div>

      {view === 'week' && (
        <>
          {/* Section 1: This Week at a Glance */}
          <section className={styles.section}>
            <p className={styles.sectionLabel}>This week</p>
            <div className={styles.glanceCard}>
              <p className={styles.glanceMsg}>{medFreeMsg}</p>
              <div className={styles.glanceMeta}>
                <span>{totalEntriesWeek} {totalEntriesWeek === 1 ? 'entry' : 'entries'} logged</span>
                {topSymptom && (
                  <span> · {topSymptom[0]} appeared {topSymptom[1]} time{topSymptom[1] !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Medication Consistency */}
          {medConsistencyData.length > 0 && (
            <section className={styles.section}>
              <p className={styles.sectionLabel}>Your medications</p>
              <div className={styles.cardList}>
                {medConsistencyData.map(({ med, message, isOveruse }) => (
                  <div key={med.name} className={styles.medCard}>
                    <p className={styles.medCardMsg}>{message}</p>
                    {isOveruse && (
                      <p className={styles.overuseNudge}>
                        Taken more than 5 times this week. If the pain persists, it might be worth speaking to a doctor. 💛
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Effect Rates */}
          {effectData.length > 0 && (
            <section className={styles.section}>
              <p className={styles.sectionLabel}>How well they worked</p>
              <div className={styles.cardList}>
                {effectData.map(({ name, helpedPct, somewhatPct, nonePct }) => (
                  <div key={name} className={styles.effectCard}>
                    <p className={styles.effectName}>{name}</p>
                    <p className={styles.effectDesc}>
                      {helpedPct >= 70
                        ? `helped you ${helpedPct}% of the time`
                        : `mixed results · helped ${helpedPct}%${somewhatPct > 0 ? `, somewhat ${somewhatPct}%` : ''}${nonePct > 0 ? `, didn't help ${nonePct}%` : ''}`}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Notes & Symptoms This Week */}
          <section className={styles.section}>
            <p className={styles.sectionLabel}>Notes & symptoms this week</p>
            {weekNotesAndSymptoms.length === 0 ? (
              <p className={styles.emptyNote}>No notes or symptoms logged this week</p>
            ) : (
              weekNotesAndSymptoms.map((entry) => (
                <div key={entry.id} className={styles.noteEntry}>
                  <span className={styles.noteTypeIcon}>{entry.type === 'symptom' ? '🩺' : '📝'}</span>
                  <div className={styles.noteBody}>
                    <p className={styles.noteDate}>{formatTimestamp(entry.timestamp)}</p>
                    <p className={styles.noteText}>{entry.text || '—'}</p>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Section 5: Medication History */}
          {medsWithHistory.length > 0 && (
            <section className={styles.section}>
              <p className={styles.sectionLabel}>Medication history</p>
              <div className={styles.cardList}>
                {medsWithHistory.map(({ name, courses }) => (
                  <div key={name} className={styles.historyCard}>
                    <p className={styles.historyMedName}>{name}</p>
                    {courses.map((c) => (
                      <p key={c.id} className={styles.historyCourseRow}>
                        {c.dose ? `${c.dose} · ` : ''}{formatDate(c.startDate)} – {formatDate(c.endDate)}
                        {c.notes ? ` · ${c.notes}` : ''}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {view === 'month' && (
        <>
          {/* Monthly Section 1: Top symptom */}
          <section className={styles.section}>
            <p className={styles.sectionLabel}>Most common symptom</p>
            {topSymptomMonth ? (
              <div className={styles.glanceCard}>
                <p className={styles.glanceMsg}>
                  {topSymptomMonth[0].charAt(0).toUpperCase() + topSymptomMonth[0].slice(1)} appeared on {topSymptomMonth[1]} day{topSymptomMonth[1] !== 1 ? 's' : ''} this month
                </p>
                <p className={styles.glanceMeta}>
                  {topSymptomMonth[1] >= 15
                    ? "That's been quite frequent — consider mentioning it to your doctor. 💛"
                    : topSymptomMonth[1] >= 7
                    ? "A recurring theme this month. Take care of yourself. 🌿"
                    : "A few days here and there — hope you're feeling better. 🌟"}
                </p>
              </div>
            ) : (
              <p className={styles.emptyNote}>No symptoms logged this month</p>
            )}
          </section>

          {/* Monthly Section 2: Per-medication stats */}
          {monthlyMedStats.length > 0 && (
            <section className={styles.section}>
              <p className={styles.sectionLabel}>Medications this month</p>
              <div className={styles.cardList}>
                {monthlyMedStats.map(({ name, count, avgEvery }) => (
                  <div key={name} className={styles.medCard}>
                    <p className={styles.medCardMsg}>
                      {name} — {count} time{count !== 1 ? 's' : ''}
                      {avgEvery ? `, every ~${avgEvery} day${avgEvery !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Monthly Section 3: Consistency tracker */}
          {consistencyMeds.length > 0 && (
            <section className={styles.section}>
              <p className={styles.sectionLabel}>Consistency</p>
              <div className={styles.cardList}>
                {consistencyMeds.map(({ name, uniqueDays, pct }) => (
                  <div key={name} className={styles.consistencyCard}>
                    <p className={styles.consistencyName}>{name}</p>
                    <p className={styles.consistencyDetail}>
                      taken {uniqueDays} out of 30 days — {pct}%
                    </p>
                    <div className={styles.consistencyBar}>
                      <div className={styles.consistencyFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Monthly Section 4: Overuse flag */}
          {overuseFlagged.length > 0 && (
            <section className={styles.section}>
              <div className={styles.cardList}>
                {overuseFlagged.map(({ name, count }) => (
                  <div key={name} className={styles.overuseCard}>
                    <p className={styles.overuseCardMsg}>
                      You took {name} {count} times this month. If you're relying on it often, it might be worth discussing with your doctor. 💛
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Monthly Section 5: Notes & Symptoms grouped by week */}
          <section className={styles.section}>
            <p className={styles.sectionLabel}>Notes & symptoms this month</p>
            {groupedByWeek.length === 0 ? (
              <p className={styles.emptyNote}>No notes or symptoms logged this month</p>
            ) : (
              groupedByWeek.map(({ weekStart, entries }) => (
                <div key={weekStart} className={styles.weekGroup}>
                  <p className={styles.weekLabel}>Week of {formatWeekOf(weekStart)}</p>
                  {entries.map((entry) => (
                    <div key={entry.id} className={styles.noteEntry}>
                      <span className={styles.noteTypeIcon}>{entry.type === 'symptom' ? '🩺' : '📝'}</span>
                      <div className={styles.noteBody}>
                        <p className={styles.noteDate}>{formatTimestamp(entry.timestamp)}</p>
                        <p className={styles.noteText}>{entry.text || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </section>
        </>
      )}

      {/* Data Export */}
      <section className={styles.section}>
        <div className={styles.dataButtons}>
          <button className={styles.dataBtn} onClick={exportJSON}>
            <RiDownloadLine />
            Export JSON
          </button>
          <button className={styles.dataBtn} onClick={exportCSV}>
            <RiDownloadLine />
            Export CSV
          </button>
          <button className={`${styles.dataBtn} ${styles.dataBtnImport}`} onClick={() => fileRef.current?.click()}>
            <RiUploadLine />
            Import Data
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
        <p className={styles.dataNote}>CSV format is easy to share with your doctor or pharmacist.</p>
      </section>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
