import styles from './SafetyModal.module.css'

export default function SafetyModal({ medName, hoursSince, safeInterval, onContinue, onWait }) {
  const hoursAgo = Math.round(hoursSince * 10) / 10
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.emoji}>💛</div>
        <h2 className={styles.title}>Friendly reminder</h2>
        <p className={styles.body}>
          Hey, looks like you already took <strong>{medName}</strong>{' '}
          {hoursAgo < 1
            ? `${Math.round(hoursAgo * 60)} minutes`
            : `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''}`}{' '}
          ago. It's usually recommended to wait{' '}
          <strong>{safeInterval} hours</strong> between doses. Continue?
        </p>
        <div className={styles.buttons}>
          <button className={styles.btnWait} onClick={onWait}>
            Wait a bit
          </button>
          <button className={styles.btnContinue} onClick={onContinue}>
            Yes, continue
          </button>
        </div>
      </div>
    </div>
  )
}
