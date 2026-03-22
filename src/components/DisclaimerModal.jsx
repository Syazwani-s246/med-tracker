import styles from './DisclaimerModal.module.css'
import { markDisclaimerSeen } from '../db'

export default function DisclaimerModal({ onDismiss }) {
  function handleAccept() {
    markDisclaimerSeen()
    onDismiss()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.emoji}>💊</div>
        <h2 className={styles.title}>Before you begin</h2>
        <p className={styles.body}>
          AmikUbat is a personal record-keeping tool only. It does not provide
          medical advice.
        </p>
        <p className={styles.body}>
          Please consult a licensed doctor or pharmacist for all health
          decisions. In an emergency, call{' '}
          <strong className={styles.emergency}>999</strong> or go to your
          nearest hospital.
        </p>
        <button className={styles.btn} onClick={handleAccept}>
          I Understand
        </button>
      </div>
    </div>
  )
}
