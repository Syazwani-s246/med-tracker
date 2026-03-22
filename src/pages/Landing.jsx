import { useNavigate } from 'react-router-dom'
import {
  RiShieldCheckLine,
  RiAlarmWarningLine,
  RiBarChartGroupedLine,
  RiHeartPulseLine,
  RiArrowRightLine,
  RiLockLine,
} from 'react-icons/ri'
import styles from './Landing.module.css'

const USP_CARDS = [
  {
    icon: RiLockLine,
    title: 'Private & Secure',
    desc: 'Everything stays on your device. No login, no cloud.',
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.1)',
  },
  {
    icon: RiAlarmWarningLine,
    title: 'Gentle Reminders',
    desc: 'Soft warnings if you might be taking a medication too soon.',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.1)',
  },
  {
    icon: RiBarChartGroupedLine,
    title: 'Easy Records',
    desc: 'Simple logs and weekly summaries to share with your doctor.',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.1)',
  },
  {
    icon: RiHeartPulseLine,
    title: 'Prevent Overdose',
    desc: 'Smart safety checks based on common medication intervals.',
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.1)',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.pill}>Your medication companion</div>
        <h1 className={styles.appName}>AmikUbat</h1>
        <p className={styles.tagline}>Track your meds. Take care of yourself.</p>
        <button className={styles.cta} onClick={() => navigate('/today')}>
          Start Tracking
          <RiArrowRightLine className={styles.ctaIcon} />
        </button>
      </div>

      <div className={styles.uspGrid}>
        {USP_CARDS.map(({ icon: Icon, title, desc, color, bg }) => (
          <div className={styles.uspCard} key={title} style={{ '--accent': color, '--bg': bg }}>
            <div className={styles.uspIconWrap}>
              <Icon className={styles.uspIcon} />
            </div>
            <h3 className={styles.uspTitle}>{title}</h3>
            <p className={styles.uspDesc}>{desc}</p>
          </div>
        ))}
      </div>

      <div className={styles.safetyBanner}>
        <RiShieldCheckLine className={styles.bannerIcon} />
        <p>
          AmikUbat is not a substitute for medical advice. Always consult a
          licensed healthcare professional for medical decisions.
        </p>
      </div>

      <footer className={styles.footer}>
        <p>All data stored locally on your device only.</p>
        <p className={styles.emergency}>
          Emergency? Call <strong>999</strong> or visit your nearest hospital.
        </p>
      </footer>
    </div>
  )
}
