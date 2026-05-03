import React, { useEffect, useState } from 'react'
import {
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Key,
  ExternalLink,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Shield
} from 'lucide-react'

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    const message = data?.error || data?.message || 'Ошибка запроса'
    const error = new Error(message)
    error.status = response.status
    error.payload = data
    throw error
  }

  return data
}

async function getMe() {
  return apiRequest('/api/auth/me')
}

async function loginUser(username, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
}

async function registerUser(payload) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

async function logoutUser() {
  return apiRequest('/api/auth/logout', {
    method: 'POST'
  })
}

async function setApiKey(key) {
  return apiRequest('/api/settings/api-key', {
    method: 'POST',
    body: JSON.stringify({ apiKey: key })
  })
}

async function getApiKeyStatus() {
  return apiRequest('/api/settings/api-key/status')
}

export default function SettingsPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [authMessage, setAuthMessage] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authSubmitting, setAuthSubmitting] = useState(false)

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  })

  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    position: ''
  })

  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  const [key, setKey] = useState('')
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [apiMessage, setApiMessage] = useState(null)
  const [showKey, setShowKey] = useState(false)

  const loadPageState = async () => {
    setAuthLoading(true)

    try {
      const [meResult, keyResult] = await Promise.allSettled([
        getMe(),
        getApiKeyStatus()
      ])

      if (meResult.status === 'fulfilled') {
        setCurrentUser(meResult.value)
      } else {
        setCurrentUser(null)
      }

      if (keyResult.status === 'fulfilled') {
        setStatus(Boolean(keyResult.value?.configured))
      } else {
        setStatus(false)
      }
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    loadPageState()
  }, [])

  const handleLogin = async () => {
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setAuthMessage({ type: 'error', text: 'Введите логин и пароль' })
      return
    }

    setAuthSubmitting(true)
    setAuthMessage(null)

    try {
      const user = await loginUser(loginForm.username.trim(), loginForm.password)
      setCurrentUser(user)
      setLoginForm({ username: '', password: '' })
      setAuthMessage({ type: 'success', text: 'Вход выполнен успешно' })
    } catch (e) {
      setAuthMessage({ type: 'error', text: e.message || 'Ошибка входа' })
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleRegister = async () => {
    const payload = {
      username: registerForm.username.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
      fullName: registerForm.fullName.trim(),
      position: registerForm.position.trim()
    }

    if (!payload.username || !payload.email || !payload.password || !payload.fullName || !payload.position) {
      setAuthMessage({ type: 'error', text: 'Заполните все поля регистрации' })
      return
    }

    setAuthSubmitting(true)
    setAuthMessage(null)

    try {
      const user = await registerUser(payload)
      setCurrentUser(user)
      setRegisterForm({
        username: '',
        email: '',
        password: '',
        fullName: '',
        position: ''
      })
      setAuthMessage({ type: 'success', text: 'Регистрация выполнена успешно' })
      setAuthMode('login')
    } catch (e) {
      setAuthMessage({ type: 'error', text: e.message || 'Ошибка регистрации' })
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setAuthSubmitting(true)
    setAuthMessage(null)

    try {
      await logoutUser()
      setCurrentUser(null)
      setAuthMessage({ type: 'success', text: 'Выход выполнен' })
    } catch (e) {
      setAuthMessage({ type: 'error', text: e.message || 'Ошибка выхода' })
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleSaveKey = async () => {
    if (!key.trim()) {
      setApiMessage({ type: 'error', text: 'Введите API-ключ' })
      return
    }

    setSaving(true)
    setApiMessage(null)

    try {
      const result = await setApiKey(key.trim())

      if (result?.success) {
        setApiMessage({ type: 'success', text: 'API-ключ успешно сохранён' })
        setStatus(true)
        setKey('')
      } else {
        setApiMessage({ type: 'error', text: result?.error || 'Ошибка сохранения' })
      }
    } catch (e) {
      setApiMessage({ type: 'error', text: e.message || 'Ошибка соединения с сервером' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Настройки
      </h1>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center">
            <User size={20} className="text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Пользователь
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Вход и регистрация для сохранения результатов тестирования
            </p>
          </div>
          {authLoading ? (
            <Loader2 size={20} className="animate-spin text-slate-400" />
          ) : currentUser ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} />
              <span className="text-xs font-medium">Авторизован</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
              <XCircle size={14} />
              <span className="text-xs font-medium">Не авторизован</span>
            </div>
          )}
        </div>

        {authMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
              authMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {authMessage.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {authMessage.text}
          </div>
        )}

        {currentUser ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Логин</p>
                  <p className="font-medium text-slate-900 dark:text-white">{currentUser.username}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Email</p>
                  <p className="font-medium text-slate-900 dark:text-white">{currentUser.email}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">ФИО</p>
                  <p className="font-medium text-slate-900 dark:text-white">{currentUser.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Должность</p>
                  <p className="font-medium text-slate-900 dark:text-white">{currentUser.position}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Класс сотрудника</p>
                  <p className="font-medium text-slate-900 dark:text-white">{currentUser.jobClass}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Роль</p>
                  <p className="font-medium text-slate-900 dark:text-white">{currentUser.role}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={authSubmitting}
              className="w-full py-2.5 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authSubmitting ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              {authSubmitting ? 'Выход...' : 'Выйти'}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  authMode === 'login'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  authMode === 'register'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Регистрация
              </button>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Логин
                  </label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Введите логин"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Введите пароль"
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(prev => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={authSubmitting}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {authSubmitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                  {authSubmitting ? 'Вход...' : 'Войти'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Логин
                    </label>
                    <input
                      type="text"
                      value={registerForm.username}
                      onChange={e => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Например, ksenia"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={e => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="example@mail.ru"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      ФИО
                    </label>
                    <input
                      type="text"
                      value={registerForm.fullName}
                      onChange={e => setRegisterForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Иванов Иван Иванович"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Должность
                    </label>
                    <input
                      type="text"
                      value={registerForm.position}
                      onChange={e => setRegisterForm(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Например, бухгалтер"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      onChange={e => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Введите пароль"
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(prev => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleRegister}
                  disabled={authSubmitting}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {authSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {authSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center">
            <Key size={20} className="text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              GigaChat API
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ключ авторизации для ИИ-функций
            </p>
          </div>
          {status === null ? (
            <Loader2 size={20} className="animate-spin text-slate-400" />
          ) : status ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} />
              <span className="text-xs font-medium">Настроен</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
              <XCircle size={14} />
              <span className="text-xs font-medium">Не настроен</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Authorization-ключ (Base64)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="Вставьте ключ авторизации..."
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowKey(prev => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveKey}
            disabled={saving}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
            {saving ? 'Сохранение...' : 'Сохранить ключ'}
          </button>

          {apiMessage && (
            <div
              className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                apiMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              {apiMessage.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {apiMessage.text}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Shield size={16} className="text-cyan-600 dark:text-cyan-400" />
          Как получить API-ключ GigaChat
        </h3>

        <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
              1
            </span>
            <span>
              Зарегистрируйтесь в{' '}
              <a
                href="https://developers.sber.ru/studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                Sber Developer Studio <ExternalLink size={12} />
              </a>
            </span>
          </li>

          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
              2
            </span>
            <span>Создайте проект и подключите API GigaChat</span>
          </li>

          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
              3
            </span>
            <span>Получите Client ID и Client Secret в разделе «Авторизационные данные»</span>
          </li>

          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
              4
            </span>
            <span>
              Скопируйте Authorization-ключ, то есть Base64-строку из связки Client ID:Client Secret,
              и вставьте её в поле выше
            </span>
          </li>
        </ol>

        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Внимание:</strong> ключ хранится на стороне приложения; для production-среды лучше
            вынести его в переменные окружения.
          </p>
        </div>
      </div>
    </div>
  )
}
