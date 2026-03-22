import { useState } from 'react'
import { RiFileTextLine, RiTimeLine, RiLinkM } from 'react-icons/ri'
import styles from './NoteCard.module.css'

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NoteCard({ log, linkedMedName, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.card} onClick={() => setExpanded((v) => !v)}>
      <div className={styles.left}>
        <div className={styles.iconWrap}>
          <RiFileTextLine />
        </div>
      </div>
      <div className={styles.body}>
        <p className={`${styles.text} ${expanded ? styles.textExpanded : ''}`}>
          {log.text || <span className={styles.empty}>No text</span>}
        </p>
        <div className={styles.meta}>
          <span className={styles.time}>
            <RiTimeLine style={{ verticalAlign: '-2px', marginRight: '2px' }} />
            {formatTime(log.timestamp)}
          </span>
          {linkedMedName && (
            <span className={styles.linkedTag}>
              <RiLinkM style={{ verticalAlign: '-2px', marginRight: '3px' }} />
              maybe re: {linkedMedName}
            </span>
          )}
        </div>
      </div>
      {onDelete && (
        <div className={styles.right}>
          <button
            className={styles.deleteBtn}
            onClick={(e) => { e.stopPropagation(); onDelete(log.id) }}
            aria-label="Delete note"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
