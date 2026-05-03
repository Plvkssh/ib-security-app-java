import React, { useCallback, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  Shield,
  Fish,
  BookOpen,
  Home,
  Moon,
  Sun,
  Menu,
  X,
  Settings,
  LogOut,
  User
} from 'lucide-react'

import { fetchMe, logout } from './lib/api'

import HomePage from './pages/HomePage'
import QuizPage from './pages/QuizPage'
import PhishingPage from './pages/PhishingPage'
import TrainingPage from './pages/TrainingPage'
import SettingsPage from './pages/SettingsPage'

function NavLink({ to, icon: Icon, children, onClick }) {
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Link
      to={to}
      onClick={onClick}
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

function Layout({
  children,
  dark,
  setDark,
  currentUser,
  authLoading,
  onLogout,
  logoutLoading
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between lg:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-600 dark:bg-cyan-500 flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white">
                  ИБ-Ассистент
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Security Awareness
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Закрыть меню"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/" icon={Home} onClick={() => setMobileOpen(false)}>
            Главная
          </NavLink>
          <NavLink to="/quiz" icon={Shield} onClick={() => setMobileOpen(false)}>
            Тест
          </NavLink>
          <NavLink to="/phishing" icon={Fish} onClick={() => setMobileOpen(false)}>
            Фишинг
          </NavLink>
          <NavLink to="/training" icon={BookOpen} onClick={() => setMobileOpen(false)}>
            Обучение
          </NavLink>
          <NavLink to="/settings" icon={Settings} onClick={() => setMobileOpen(false)}>
            Настройки
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {authLoading ? (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Проверка сессии...
              </div>
            ) : currentUser ? (
              <div className="flex items-start gap-2">
                <User size={16} className="mt-0.5 text-cyan-600 dark:text-cyan-400" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {currentUser.username || 'Пользователь'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email || 'Авторизован'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Гость. Вход и регистрация доступны в настройках.
              </div>
            )}
          </div>

          {currentUser && (
            <button
              type="button"
              onClick={onLogout}
              disabled={logoutLoading}
              className="flex items-center justify-center gap-2 text-sm w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
            >
              <LogOut size={16} />
              {logoutLoading ? 'Выход...' : 'Выйти'}
            </button>
          )}

          <button
            type="button"
            data-testid="theme-toggle"
            onClick={() => setDark(prev => !prev)}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Светлая тема' : 'Тёмная тема'}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="lg:hidden flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30">
          <button
            type="button"
            data-testid="mobile-menu"
            onClick={() => setMobileOpen(true)}
            className="text-slate-600 dark:text-slate-400"
            aria-label="Открыть меню"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-2">
            <Shield size={20} className="text-cyan-600 dark:text-cyan-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              ИБ-Ассистент
            </span>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

function AppRoutes({
  dark,
  setDark,
  currentUser,
  authLoading,
  authError,
  refreshAuth,
  setCurrentUser,
  handleLogout,
  logoutLoading
}) {
  return (
    <Layout
      dark={dark}
      setDark={setDark}
      currentUser={currentUser}
      authLoading={authLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              currentUser={currentUser}
              authLoading={authLoading}
              authError={authError}
            />
          }
        />
        <Route
          path="/quiz"
          element={
            <QuizPage
              currentUser={currentUser}
              authLoading={authLoading}
              authError={authError}
              refreshAuth={refreshAuth}
            />
          }
        />
        <Route
          path="/phishing"
          element={
            <PhishingPage
              currentUser={currentUser}
              authLoading={authLoading}
              authError={authError}
            />
          }
        />
        <Route
          path="/training"
          element={
            <TrainingPage
              currentUser={currentUser}
              authLoading={authLoading}
              authError={authError}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <SettingsPage
              currentUser={currentUser}
              authLoading={authLoading}
              authError={authError}
              refreshAuth={refreshAuth}
              setCurrentUser={setCurrentUser}
              onLogout={handleLogout}
              logoutLoading={logoutLoading}
            />
          }
        />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const refreshAuth = useCallback(async () => {
    setAuthLoading(true)
    setAuthError('')

    try {
      const result = await fetchMe()

      if (result?.authenticated && result?.user) {
        setCurrentUser(result.user)
      } else {
        setCurrentUser(null)
      }
    } catch (e) {
      setCurrentUser(null)
      setAuthError(e.message || 'Не удалось проверить авторизацию')
    } finally {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true)
    setAuthError('')

    try {
      await logout()
      setCurrentUser(null)
    } catch (e) {
      setAuthError(e.message || 'Не удалось выполнить выход')
    } finally {
      setLogoutLoading(false)
    }
  }, [])

  return (
    <HashRouter>
      <AppRoutes
        dark={dark}
        setDark={setDark}
        currentUser={currentUser}
        authLoading={authLoading}
        authError={authError}
        refreshAuth={refreshAuth}
        setCurrentUser={setCurrentUser}
        handleLogout={handleLogout}
        logoutLoading={logoutLoading}
      />
    </HashRouter>
  )
}
