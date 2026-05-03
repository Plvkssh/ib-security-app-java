import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Fish, AlertTriangle, CheckCircle2, XCircle, Eye, EyeOff, Loader2, Mail, MessageSquare, Phone, Sparkles, Settings, AlertCircle } from 'lucide-react'
import { generatePhishing, generateAIPhishing, getApiKeyStatus } from '../lib/api'

const TYPES = [
  { id: '', label: 'Все типы' },
  { id: 'email', label: 'Email-фишинг' },
  { id: 'spear', label: 'Целевой (spear)' },
  { id: 'vishing', label: 'Вишинг' },
  { id: 'smishing', label: 'Смишинг' },
  { id: 'bec', label: 'BEC' },
]

const DIFFS = [
  { id: '', label: 'Все' },
  { id: 'лёгкий', label: 'Лёгкий' },
  { id: 'средний', label: 'Средний' },
  { id: 'сложный', label: 'Сложный' },
]

const TRIGGERS = [
  { id: '', label: 'Все' },
  { id: 'страх', label: 'Страх' },
  { id: 'срочность', label: 'Срочность' },
  { id: 'жадность', label: 'Жадность' },
  { id: 'авторитет', label: 'Авторитет' },
  { id: 'любопытство', label: 'Любопытство' },
  { id: 'доверие', label: 'Доверие' },
]

const typeIcons = { email: Mail, spear: Mail, vishing: Phone, smishing: MessageSquare, bec: Mail }
const diffColors = { 'лёгкий': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', 'средний': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', 'сложный': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' }

export default function PhishingPage() {
  const [config, setConfig] = useState({ type: '', difficulty: '', trigger: '', count: 3 })
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState({})

  const [apiKeyConfigured, setApiKeyConfigured] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiScenario, setAiScenario] = useState(null)
  const [aiError, setAiError] = useState(null)

  useEffect(() => {
    getApiKeyStatus()
      .then(data => setApiKeyConfigured(data.configured))
      .catch(() => setApiKeyConfigured(false))
  }, [])

  const generate = async () => {
    setLoading(true)
    try {
      const data = await generatePhishing(config)
      setScenarios(data)
      setExpanded({})
      setAiScenario(null)
      setAiError(null)
    } catch (e) {
      alert('Ошибка генерации сценариев')
    }
    setLoading(false)
  }

  const generateAI = async () => {
    setAiLoading(true)
    setAiError(null)
    setAiScenario(null)
    try {
      const result = await generateAIPhishing()
      if (result.success) {
        setAiScenario({
          ...result.scenario,
          id: 'ai-' + Date.now(),
          type: 'email',
          difficulty: 'средний',
          trigger: 'unknown',
        })
      } else {
        setAiError(result.error)
      }
    } catch (e) {
      setAiError('Ошибка соединения с сервером')
    }
    setAiLoading(false)
  }

  const toggle = (id, section) => {
    setExpanded(prev => ({ ...prev, [`${id}-${section}`]: !prev[`${id}-${section}`] }))
  }

  const renderScenario = (sc, idx, isAI = false) => {
    const Icon = typeIcons[sc.type] || Mail
    return (
      <div key={sc.id || idx} className={`bg-white dark:bg-slate-900 rounded-xl border overflow-hidden ${
        isAI ? 'border-purple-300 dark:border-purple-700' : 'border-slate-200 dark:border-slate-800'
      }`} data-testid={isAI ? 'ai-scenario' : `scenario-${idx}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          {isAI && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 flex items-center gap-1">
              <Sparkles size={12} /> ИИ
            </span>
          )}
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Icon size={12} /> {sc.type}
          </span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${diffColors[sc.difficulty] || 'bg-slate-100 text-slate-600'}`}>
            {sc.difficulty}
          </span>
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
            {sc.trigger}
          </span>
          <span className="ml-auto text-xs text-slate-400">{isAI ? 'ИИ-сценарий' : `Сценарий #${idx + 1}`}</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">От:</span> {sc.from}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            <span className="font-medium">Тема:</span> {sc.subject}
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            {sc.body}
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sc.redFlags && sc.redFlags.length > 0 && (
            <div className="p-4">
              <button onClick={() => toggle(sc.id, 'red')} className="flex items-center gap-2 w-full text-left text-sm font-medium text-red-600 dark:text-red-400">
                <AlertTriangle size={16} />
                Красные флаги ({sc.redFlags.length})
                {expanded[`${sc.id}-red`] ? <EyeOff size={14} className="ml-auto" /> : <Eye size={14} className="ml-auto" />}
              </button>
              {expanded[`${sc.id}-red`] && (
                <ul className="mt-3 space-y-2">
                  {sc.redFlags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="text-red-500 mt-0.5">●</span> {f}
                    </li>
                  ))}
                  {sc.hiddenFlags && sc.hiddenFlags.length > 0 && (
                    <>
                      <li className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-2">Неочевидные признаки:</li>
                      {sc.hiddenFlags.map((f, i) => (
                        <li key={`h-${i}`} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="text-amber-500 mt-0.5">●</span> {f}
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              )}
            </div>
          )}

          {sc.correctActions && sc.correctActions.length > 0 && (
            <div className="p-4">
              <button onClick={() => toggle(sc.id, 'correct')} className="flex items-center gap-2 w-full text-left text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} />
                Правильные действия ({sc.correctActions.length})
                {expanded[`${sc.id}-correct`] ? <EyeOff size={14} className="ml-auto" /> : <Eye size={14} className="ml-auto" />}
              </button>
              {expanded[`${sc.id}-correct`] && (
                <ul className="mt-3 space-y-2">
                  {sc.correctActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" /> {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {sc.dangerousActions && sc.dangerousActions.length > 0 && (
            <div className="p-4">
              <button onClick={() => toggle(sc.id, 'danger')} className="flex items-center gap-2 w-full text-left text-sm font-medium text-red-600 dark:text-red-400">
                <XCircle size={16} />
                Опасные действия ({sc.dangerousActions.length})
                {expanded[`${sc.id}-danger`] ? <EyeOff size={14} className="ml-auto" /> : <Eye size={14} className="ml-auto" />}
              </button>
              {expanded[`${sc.id}-danger`] && (
                <ul className="mt-3 space-y-2">
                  {sc.dangerousActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" /> {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Фишинговые сценарии</h1>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Тип</label>
            <select data-testid="phishing-type" value={config.type} onChange={e => setConfig(c => ({ ...c, type: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100">
              {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Сложность</label>
            <select data-testid="phishing-diff" value={config.difficulty} onChange={e => setConfig(c => ({ ...c, difficulty: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100">
              {DIFFS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Триггер</label>
            <select data-testid="phishing-trigger" value={config.trigger} onChange={e => setConfig(c => ({ ...c, trigger: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100">
              {TRIGGERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Количество</label>
            <select data-testid="phishing-count" value={config.count} onChange={e => setConfig(c => ({ ...c, count: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100">
              {[1, 3, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button data-testid="generate-phishing" onClick={generate} disabled={loading}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Fish size={16} />}
            {loading ? 'Генерация...' : 'Сгенерировать'}
          </button>

          {apiKeyConfigured ? (
            <button onClick={generateAI} disabled={aiLoading}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {aiLoading ? 'ИИ генерирует...' : 'ИИ-генерация'}
            </button>
          ) : (
            <Link to="/settings"
              className="flex-1 sm:flex-none px-6 py-2.5 border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-950">
              <Sparkles size={16} />
              ИИ-генерация
              <Settings size={14} className="opacity-50" />
            </Link>
          )}
        </div>

        {aiError && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
            <XCircle size={14} /> {aiError}
          </div>
        )}
      </div>

      {aiScenario && (
        <div className="space-y-6 mb-6">
          {renderScenario(aiScenario, 0, true)}
        </div>
      )}

      <div className="space-y-6">
        {scenarios.map((sc, idx) => renderScenario(sc, idx, false))}
      </div>

      {scenarios.length === 0 && !aiScenario && !loading && !aiLoading && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-600">
          <Fish size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Настройте параметры и нажмите «Сгенерировать»</p>
        </div>
      )}
    </div>
  )
}
