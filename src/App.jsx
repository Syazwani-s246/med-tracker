import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { hasSeenDisclaimer } from './db'
import DisclaimerModal from './components/DisclaimerModal'
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'
import Landing from './pages/Landing'
import Today from './pages/Today'
import LogMed from './pages/LogMed'
import History from './pages/History'
import Summary from './pages/Summary'

function AppShell() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  useEffect(() => {
    if (!hasSeenDisclaimer()) {
      setShowDisclaimer(true)
    }
  }, [])

  return (
    <>
      <Routes>
        <Route path="/today" element={<Today />} />
        <Route path="/log" element={<LogMed />} />
        <Route path="/history" element={<History />} />
        <Route path="/summary" element={<Summary />} />
      </Routes>
      <BottomNav />
      <InstallPrompt />
      {showDisclaimer && (
        <DisclaimerModal onDismiss={() => setShowDisclaimer(false)} />
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  )
}
