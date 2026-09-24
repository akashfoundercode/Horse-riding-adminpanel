import { useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './hooks/useAuth.js'
import { GameEngineProvider } from './context/GameEngineContext.jsx'

import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import QuickSearchModal from './components/QuickSearchModal.jsx'

import Dashboard from './pages/Dashboard.jsx'
import Horses from './pages/Horses.jsx'
import Races from './pages/Races.jsx'
import Bets from './pages/Bets.jsx'
import Users from './pages/Users.jsx'
import Wallet from './pages/Wallet.jsx'
import Settings from './pages/Settings.jsx'
import Jackpot from './pages/Jackpot.jsx'
import Login from './pages/Login.jsx'

const titles = {
  "/": "Executive Live Dashboard",
  "/horses": "Master Horses Management (12 Runners)",
  "/races": "Live Race Command & Matches History",
  "/rounds": "Live Race Command & Matches History",
  "/bets": "Live Betting Monitor & Historical Ledger",
  "/users": "User Directory & Permanent Game Profiles",
  "/wallet": "Platform Wallet & Financial Ledger",
  "/settings": "Global Game Engine Configuration",
}

function MainLayout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  if (location.pathname === '/login') {
    return <Login />
  }

  const title = titles[location.pathname] ?? "Executive Dashboard"

  return (
    <div className="flex min-h-screen bg-base text-ink font-body transition-colors duration-200">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title={title}
          onOpenSearch={() => setSearchOpen(true)}
          setMobileOpen={setMobileOpen}
        />

        <main className="flex-1 min-w-0 pb-12">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/horses" element={<Horses />} />
            <Route path="/races" element={<Races />} />
            <Route path="/rounds" element={<Navigate to="/races" replace />} />
            <Route path="/bets" element={<Bets />} />
            <Route path="/users" element={<Users />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/jackpot" element={<Navigate to="/races" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <QuickSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GameEngineProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </GameEngineProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
