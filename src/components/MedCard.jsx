import { RiCheckLine, RiSubtractLine, RiCloseLine, RiTimeLine, RiCapsuleLine } from 'react-icons/ri'
import styles from './MedCard.module.css'

const EFFECT_CONFIG = {
  helped: { icon: RiCheckLine, label: 'Helped', className: styles.effectHelped },
  somewhat: { icon: RiSubtractLine, label: 'Somewhat', className: styles.effectSomewhat },
  none: { icon: RiCloseLine, label: "Didn't Help", className: styles.effectNone },
  unknown: { icon: null, label: 'Not sure yet', className: styles.effectUnknown },
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MedCard({ log, onEdit, onDelete }) {
  const effect = EFFECT_CONFIG[log.effect] || EFFECT_CONFIG.unknown
  const EffectIcon = effect.icon

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.iconWrap}>
          <RiCapsuleLine />
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.name}>{log.name}</div>
        <div className={styles.meta}>
          {log.dose && <span>{log.dose}</span>}
          {log.dose && <span className={styles.dot}>·</span>}
          <span className={styles.time}>
            <RiTimeLine style={{ verticalAlign: '-2px', marginRight: '2px' }} />
            {formatTime(log.timestamp)}
          </span>
        </div>
        {log.reason && (
          <span className={styles.reasonTag}>{log.reason}</span>
        )}
      </div>
      <div className={styles.right}>
        <span className={`${styles.effectBadge} ${effect.className}`}>
          {EffectIcon && <EffectIcon />}
          {effect.label}
        </span>
        {(onEdit || onDelete) && (
          <div className={styles.actions}>
            {onEdit && (
              <button className={styles.actionBtn} onClick={() => onEdit(log)} aria-label="Edit">
                Edit
              </button>
            )}
            {onDelete && (
              <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onDelete(log.id)} aria-label="Delete">
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
