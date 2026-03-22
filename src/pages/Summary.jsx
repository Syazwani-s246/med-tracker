import { useState, useRef } from 'react'
import { getLogsSince, exportJSON, exportCSV, importJSON } from '../db'
import { generateInsights } from '../insights'
import Toast from '../components/Toast'
import { RiDownloadLine, RiUploadLine, RiInformationLine, RiSparklingLine } from 'react-icons/ri'
import styles from './Summary.module.css'

export default function Summary() {
  const [period, setPeriod] = useState('week')
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)

  const days = period === 'week' ? 7 : 30
  const logs = getLogsSince(days)
  const { insights, overuse } = generateInsights(logs, period)

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
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${period === 'week' ? styles.toggleActive : ''}`}
            onClick={() => setPeriod('week')}
          >
            This Week
          </button>
          <button
            className={`${styles.toggleBtn} ${period === 'month' ? styles.toggleActive : ''}`}
            onClick={() => setPeriod('month')}
          >
            This Month
          </button>
        </div>
      </header>

      {/* Insights */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <RiSparklingLine className={styles.sectionIcon} />
          Insights
        </div>

        <div className={styles.insightsList}>
          {insights.map((text, i) => (
            <div key={i} className={styles.insightCard}>
              <RiInformationLine className={styles.insightIcon} />
              <p className={styles.insightText}>{text}</p>
            </div>
          ))}
        </div>

        {overuse.length > 0 && (
          <div className={styles.overuseList}>
            {overuse.map((text, i) => (
              <div key={i} className={styles.overuseCard}>
                <p className={styles.insightText}>{text}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Data control */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <RiDownloadLine className={styles.sectionIcon} />
          Your Data
        </div>

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
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
        <p className={styles.dataNote}>
          CSV format is easy to share with your doctor or pharmacist.
        </p>
      </section>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
