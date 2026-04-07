import React, { useState, useEffect } from 'react'
import { Settings, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Key, ExternalLink } from 'lucide-react'
import { setApiKey, getApiKeyStatus } from '../lib/api'

export default function SettingsPage() {
  const [key, setKey] = useState('')
  const [status, setStatus] = useState(null) // null = loading, true/false
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    getApiKeyStatus()
      .then(data => setStatus(data.configured))
      .catch(() => setStatus(false))
  }, [])

  const handleSave = async () => {
    if (!key.trim()) {
      setMessage({ type: 'error', text: 'Введите API-ключ' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const result = await setApiKey(key.trim())
      if (result.success) {
        setMessage({ type: 'success', text: 'API-ключ успешно сохранён' })
        setStatus(true)
        setKey('')
      } else {
        setMessage({ type: 'error', text: result.error || 'Ошибка сохранения' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' })
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Настройки</h1>

      {/* API Key Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center">
            <Key size={20} className="text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">GigaChat API</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ключ авторизации для ИИ-функций</p>
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
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
            {saving ? 'Сохранение...' : 'Сохранить ключ'}
          </button>

          {message && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Instructions Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Как получить API-ключ GigaChat</h3>
        <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <span>
              Зарегистрируйтесь в{' '}
              <a href="https://developers.sber.ru/studio/" target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1">
                Sber Developer Studio <ExternalLink size={12} />
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <span>Создайте проект и подключите API GigaChat</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <span>Получите Client ID и Client Secret в разделе «Авторизационные данные»</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
            <span>Скопируйте Authorization-ключ (Base64-кодированная строка из Client ID:Client Secret) и вставьте выше</span>
          </li>
        </ol>

        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Внимание:</strong> Ключ хранится в памяти сервера и будет сброшен при перезапуске приложения. Для продакшн-среды рекомендуется хранить ключ в переменных окружения.
          </p>
        </div>
      </div>
    </div>
  )
}
