import { useEffect, useState } from 'react'
import styles from './Toast.module.css'

export default function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={`${styles.toast} ${visible ? styles.in : styles.out}`}>
      {message}
    </div>
  )
}
