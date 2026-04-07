import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Fish, BookOpen, TrendingUp, Award, BarChart3, Sparkles, Bot, CheckCircle2, XCircle, Settings } from 'lucide-react'
import { fetchStats, getApiKeyStatus } from '../lib/api'

export default function HomePage() {
  const [stats, setStats] = useState(null)
  const [aiStatus, setAiStatus] = useState(null) // null = loading, true/false

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {})
    getApiKeyStatus()
      .then(data => setAiStatus(data.configured))
      .catch(() => setAiStatus(false))
  }, [])

  const cards = [
    {
      title: 'Тест на осведомлённость',
      desc: 'Проверьте свои знания в области информационной безопасности. Вопросы по фишингу, паролям, защите данных и реагированию на инциденты.',
      icon: Shield,
      to: '/quiz',
      color: 'from-cyan-500 to-cyan-700',
      btnText: 'Начать тест'
    },
    {
      title: 'Фишинговые сценарии',
      desc: 'Изучите реалистичные примеры фишинговых атак с подробным разбором красных флагов и правильных действий.',
      icon: Fish,
      to: '/phishing',
      color: 'from-amber-500 to-orange-600',
      btnText: 'Смотреть сценарии'
    },
    {
      title: 'Обучающие материалы',
      desc: 'Справочник по кибербезопасности: от распознавания фишинга до нормативной базы 152-ФЗ и требований ФСТЭК.',
      icon: BookOpen,
      to: '/training',
      color: 'from-emerald-500 to-green-700',
      btnText: 'Начать обучение'
    }
  ]

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Информационная безопасность
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl">
          Платформа для тестирования осведомлённости сотрудников и моделирования фишинговых кампаний.
          Адаптирована под российское законодательство (152-ФЗ, КИИ, ФСТЭК).
        </p>
      </div>

      {/* Stats bar */}
      {stats && stats.totalTests > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center">
              <BarChart3 size={20} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Тестов пройдено</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white" data-testid="stat-tests">{stats.totalTests}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Средний балл</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white" data-testid="stat-avg">{stats.averageScore}%</p>
            </div>
          </div>
          {stats.lastResult && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                <Award size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Последний уровень</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white" data-testid="stat-level">{stats.lastResult.level}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Status Card */}
      <div className="mb-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-purple-500 to-violet-600" />
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <Bot size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">ИИ-функции (GigaChat)</h2>
                {aiStatus === null ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">Проверка...</span>
                ) : aiStatus ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Активен
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <XCircle size={12} /> Не настроен
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Персональный ИИ-анализ результатов, генерация вопросов для тренировки слабых тем и создание уникальных фишинговых сценариев.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950 text-xs text-purple-700 dark:text-purple-400">
                  <Sparkles size={12} /> ИИ-анализ результатов
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950 text-xs text-purple-700 dark:text-purple-400">
                  <Sparkles size={12} /> Генерация вопросов
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950 text-xs text-purple-700 dark:text-purple-400">
                  <Sparkles size={12} /> ИИ-фишинг сценарии
                </span>
              </div>
              {!aiStatus && aiStatus !== null && (
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  <Settings size={14} />
                  Настроить API-ключ
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(card => (
          <Link
            key={card.to}
            to={card.to}
            data-testid={`card-${card.to.replace('/', '')}`}
            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-lg"
          >
            <div className={`h-2 bg-gradient-to-r ${card.color}`} />
            <div className="p-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                <card.icon size={24} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{card.title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{card.desc}</p>
              <span className="inline-flex items-center text-sm font-medium text-cyan-600 dark:text-cyan-400 group-hover:gap-2 transition-all">
                {card.btnText} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
