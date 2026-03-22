import { NavLink } from 'react-router-dom'
import { RiHome5Line, RiAddCircleLine, RiCalendarLine, RiBarChartLine } from 'react-icons/ri'
import styles from './BottomNav.module.css'

const tabs = [
  { to: '/today', icon: RiHome5Line, label: 'Today' },
  { to: '/log', icon: RiAddCircleLine, label: 'Log' },
  { to: '/history', icon: RiCalendarLine, label: 'History' },
  { to: '/summary', icon: RiBarChartLine, label: 'Summary' },
]

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
        >
          <Icon className={styles.icon} />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
