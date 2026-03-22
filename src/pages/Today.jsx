import { useState, useEffect } from 'react'
import { getLogsForToday } from '../db'
import MedCard from '../components/MedCard'
import styles from './Today.module.css'

function formatHeader() {
  return new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function Today() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    setLogs(getLogsForToday().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)))
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.dateLabel}>{formatHeader()}</p>
        <h1 className={styles.title}>Today</h1>
      </header>

      {logs.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🌿</div>
          <p>No medications logged today.</p>
          <p className={styles.emptySubtext}>Take care of yourself!</p>
        </div>
      ) : (
        <div className={styles.list}>
          <p className={styles.count}>{logs.length} medication{logs.length !== 1 ? 's' : ''} today</p>
          {logs.map((log) => (
            <MedCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}
