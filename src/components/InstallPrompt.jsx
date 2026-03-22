import { useState, useEffect } from 'react'
import { RiDownloadLine, RiCloseLine } from 'react-icons/ri'
import styles from './InstallPrompt.module.css'

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Check if already dismissed
    if (localStorage.getItem('amikubat_install_dismissed')) return

    // Detect iOS (Safari) — no beforeinstallprompt support
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    if (ios) {
      setIsIOS(true)
      return
    }

    function handleBeforeInstall(e) {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  function handleInstall() {
    if (!prompt) return
    prompt.prompt()
    prompt.userChoice.then(() => {
      setPrompt(null)
    })
  }

  function handleDismiss() {
    localStorage.setItem('amikubat_install_dismissed', '1')
    setPrompt(null)
    setDismissed(true)
    setShowIOSHint(false)
  }

  if (dismissed) return null

  // iOS: show a hint button in the corner
  if (isIOS && !showIOSHint) {
    return (
      <button className={styles.iosTrigger} onClick={() => setShowIOSHint(true)}>
        <RiDownloadLine />
      </button>
    )
  }

  if (isIOS && showIOSHint) {
    return (
      <div className={styles.banner}>
        <div className={styles.bannerBody}>
          <span className={styles.bannerEmoji}>📲</span>
          <div>
            <p className={styles.bannerTitle}>Add to Home Screen</p>
            <p className={styles.bannerDesc}>
              Tap the <strong>Share</strong> button then <strong>Add to Home Screen</strong> to install AmikUbat.
            </p>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Dismiss">
          <RiCloseLine />
        </button>
      </div>
    )
  }

  if (!prompt) return null

  return (
    <div className={styles.banner}>
      <div className={styles.bannerBody}>
        <span className={styles.bannerEmoji}>💊</span>
        <div>
          <p className={styles.bannerTitle}>Install AmikUbat</p>
          <p className={styles.bannerDesc}>Add to your home screen for quick access, anytime.</p>
        </div>
      </div>
      <div className={styles.bannerActions}>
        <button className={styles.installBtn} onClick={handleInstall}>
          <RiDownloadLine />
          Install
        </button>
        <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Dismiss">
          <RiCloseLine />
        </button>
      </div>
    </div>
  )
}
