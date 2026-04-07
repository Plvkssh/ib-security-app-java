import React, { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Shield, Fish, BookOpen, Home, Moon, Sun, Menu, X, Settings } from 'lucide-react'
import HomePage from './pages/HomePage'
import QuizPage from './pages/QuizPage'
import PhishingPage from './pages/PhishingPage'
import TrainingPage from './pages/TrainingPage'
import SettingsPage from './pages/SettingsPage'

function NavLink({ to, icon: Icon, children }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      data-testid={`nav-${to.replace('/', '') || 'home'}`}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-cyan-600 text-white dark:bg-cyan-500'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={18} />
      <span>{children}</span>
    </Link>
  )
}

function Layout({ children, dark, setDark }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-600 dark:bg-cyan-500 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white">Ассистент</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Security Awareness</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/" icon={Home}>Главная</NavLink>
          <NavLink to="/quiz" icon={Shield}>Тест</NavLink>
          <NavLink to="/phishing" icon={Fish}>Фишинг</NavLink>
          <NavLink to="/training" icon={BookOpen}>Обучение</NavLink>
          <NavLink to="/settings" icon={Settings}>Настройки</NavLink>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            data-testid="theme-toggle"
            onClick={() => setDark(!dark)}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Светлая тема' : 'Тёмная тема'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="lg:hidden flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button data-testid="mobile-menu" onClick={() => setMobileOpen(true)} className="text-slate-600 dark:text-slate-400">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-cyan-600 dark:text-cyan-400" />
            <span className="font-bold text-sm">ИБ-Ассистент</span>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <HashRouter>
      <Layout dark={dark} setDark={setDark}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/phishing" element={<PhishingPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}