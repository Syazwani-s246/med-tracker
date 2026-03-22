import styles from './SafetyModal.module.css'

function formatTime(hoursSince) {
  const h = Math.round(hoursSince * 10) / 10
  return h < 1
    ? `${Math.round(h * 60)} minutes`
    : `${h} hour${h !== 1 ? 's' : ''}`
}

export default function IngredientModal({ newMed, overlaps, onContinue, onWait }) {
  function buildMessage() {
    if (overlaps.length === 1) {
      const { medName, sharedIngredients, hoursSince } = overlaps[0]
      const ingredientText = sharedIngredients.join(' and ')
      return (
        <>
          Heads up — <strong>{newMed}</strong> and <strong>{medName}</strong> both contain{' '}
          <strong>{ingredientText}</strong>. You took <strong>{medName}</strong>{' '}
          {formatTime(hoursSince)} ago. Just something to be aware of — not a reason to panic.
        </>
      )
    }

    return (
      <>
        Heads up — <strong>{newMed}</strong> shares ingredients with some things you've already taken:
        <br /><br />
        {overlaps.map(({ medName, sharedIngredients, hoursSince }) => (
          <span key={medName}>
            • <strong>{medName}</strong> ({sharedIngredients.join(', ')}) — taken {formatTime(hoursSince)} ago<br />
          </span>
        ))}
        <br />
        Just something to be aware of — not a reason to panic.
      </>
    )
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.emoji}>💛</div>
        <h2 className={styles.title}>Just a heads up</h2>
        <p className={styles.body}>
          {buildMessage()} Continue?
        </p>
        <div className={styles.buttons}>
          <button className={styles.btnWait} onClick={onWait}>
            I'll wait
          </button>
          <button className={styles.btnContinue} onClick={onContinue}>
            Got it, continue
          </button>
        </div>
      </div>
    </div>
  )
}
