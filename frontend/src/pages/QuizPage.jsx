import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, CheckCircle2, XCircle, ArrowRight, RotateCcw, Home, Loader2, Sparkles, BrainCircuit, AlertCircle, Settings } from 'lucide-react'
import { fetchQuestions, saveResult, generateAIFeedback, generateAIQuestions, getApiKeyStatus } from '../lib/api'

const TOPICS = [
  { id: 'phishing', label: 'Фишинг и социальная инженерия' },
  { id: 'passwords', label: 'Парольная политика' },
  { id: 'email', label: 'Безопасная работа с email' },
  { id: 'personal_data', label: 'Защита персональных данных (152-ФЗ)' },
  { id: 'mobile', label: 'Безопасность мобильных устройств' },
  { id: 'incidents', label: 'Реагирование на инциденты' },
]

const DIFFICULTIES = [
  { id: 'базовый', label: 'Базовый' },
  { id: 'продвинутый', label: 'Продвинутый' },
  { id: 'экспертный', label: 'Экспертный' },
]

function getLevel(pct) {
  if (pct >= 81) return { label: 'Эксперт', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950' }
  if (pct >= 61) return { label: 'Уверенный', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950' }
  if (pct >= 41) return { label: 'Базовый', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' }
  return { label: 'Начинающий', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' }
}

const topicLabels = Object.fromEntries(TOPICS.map(t => [t.id, t.label]))

export default function QuizPage() {
  const [phase, setPhase] = useState('config') // config | quiz | result
  const [config, setConfig] = useState({ difficulty: '', topics: [], count: 10 })
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(false)

  const [apiKeyConfigured, setApiKeyConfigured] = useState(false)
  const [aiFeedback, setAiFeedback] = useState(null)
  const [aiFeedbackLoading, setAiFeedbackLoading] = useState(false)
  const [aiFeedbackError, setAiFeedbackError] = useState(null)
  const [aiTrainingLoading, setAiTrainingLoading] = useState(false)
  const [aiTrainingError, setAiTrainingError] = useState(null)
  const [isAiQuiz, setIsAiQuiz] = useState(false)

  useEffect(() => {
    getApiKeyStatus()
      .then(data => setApiKeyConfigured(data.configured))
      .catch(() => setApiKeyConfigured(false))
  }, [])

  const startQuiz = async () => {
    setLoading(true)
    try {
      const qs = await fetchQuestions(config.difficulty, config.topics, config.count)
      if (qs.length === 0) {
        alert('Нет вопросов по выбранным критериям. Измените параметры.')
        setLoading(false)
        return
      }
      setQuestions(qs)
      setCurrent(0)
      setAnswers([])
      setSelected(null)
      setAnswered(false)
      setIsAiQuiz(false)
      setAiFeedback(null)
      setAiFeedbackError(null)
      setAiTrainingError(null)
      setPhase('quiz')
    } catch (e) {
      alert('Ошибка загрузки вопросов')
    }
    setLoading(false)
  }

  const submitAnswer = () => {
    if (selected === null) return
    setAnswered(true)
    setAnswers([...answers, { questionId: questions[current].id, selected, correct: selected === questions[current].correctAnswer }])
  }

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = async () => {
    const score = answers.filter(a => a.correct).length + (selected === questions[current]?.correctAnswer ? 1 : 0)
    const total = questions.length
    const pct = Math.round(score / total * 100)
    const level = getLevel(pct)
    const result = {
      score, totalQuestions: total,
      difficulty: config.difficulty || 'все',
      topics: config.topics.length ? config.topics : ['все'],
      level: level.label,
      completedAt: new Date().toISOString()
    }
    try { await saveResult(result) } catch (e) {}
    setPhase('result')
  }

  const reset = () => {
    setPhase('config')
    setConfig({ difficulty: '', topics: [], count: 10 })
    setQuestions([])
    setAnswers([])
    setCurrent(0)
    setSelected(null)
    setAnswered(false)
    setAiFeedback(null)
    setAiFeedbackError(null)
    setAiTrainingError(null)
    setIsAiQuiz(false)
  }

  const toggleTopic = (id) => {
    setConfig(c => ({
      ...c,
      topics: c.topics.includes(id) ? c.topics.filter(t => t !== id) : [...c.topics, id]
    }))
  }

  const handleAiFeedback = async (topicResults) => {
    setAiFeedbackLoading(true)
    setAiFeedbackError(null)
    setAiFeedback(null)
    try {
      const totalCorrect = answers.filter(a => a.correct).length
      const result = await generateAIFeedback(totalCorrect, questions.length, topicResults)
      if (result.success) {
        setAiFeedback(result.feedback)
      } else {
        setAiFeedbackError(result.error)
      }
    } catch (e) {
      setAiFeedbackError('Ошибка соединения с сервером')
    }
    setAiFeedbackLoading(false)
  }

  const handleAiTraining = async (weakTopicIds) => {
    setAiTrainingLoading(true)
    setAiTrainingError(null)
    try {
      const difficulty = config.difficulty || 'базовый'
      const result = await generateAIQuestions(weakTopicIds, difficulty, 5)
      if (result.success && result.questions && result.questions.length > 0) {
        setQuestions(result.questions)
        setCurrent(0)
        setAnswers([])
        setSelected(null)
        setAnswered(false)
        setIsAiQuiz(true)
        setAiFeedback(null)
        setAiFeedbackError(null)
        setPhase('quiz')
      } else {
        setAiTrainingError(result.error || 'Не удалось сгенерировать вопросы')
      }
    } catch (e) {
      setAiTrainingError('Ошибка соединения с сервером')
    }
    setAiTrainingLoading(false)
  }

  if (phase === 'config') {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Настройка теста</h1>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Уровень сложности</label>
            <div className="flex flex-wrap gap-2">
              <button
                data-testid="diff-all"
                onClick={() => setConfig(c => ({ ...c, difficulty: '' }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !config.difficulty ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >Все уровни</button>
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  data-testid={`diff-${d.id}`}
                  onClick={() => setConfig(c => ({ ...c, difficulty: d.id }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    config.difficulty === d.id ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >{d.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Количество вопросов</label>
            <div className="flex gap-2">
              {[10, 15, 20].map(n => (
                <button
                  key={n}
                  data-testid={`count-${n}`}
                  onClick={() => setConfig(c => ({ ...c, count: n }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    config.count === n ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >{n}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Тематика (оставьте пустым для всех)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TOPICS.map(t => (
                <label
                  key={t.id}
                  data-testid={`topic-${t.id}`}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                    config.topics.includes(t.id)
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950 dark:border-cyan-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={config.topics.includes(t.id)}
                    onChange={() => toggleTopic(t.id)}
                    className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            data-testid="start-quiz"
            onClick={startQuiz}
            disabled={loading}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
            {loading ? 'Загрузка...' : 'Начать тест'}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'quiz') {
    const q = questions[current]
    const progress = ((current + (answered ? 1 : 0)) / questions.length) * 100
    const isCorrect = selected === q.correctAnswer

    return (
      <div className="max-w-2xl mx-auto">
        {isAiQuiz && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
            <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">ИИ-тренировка слабых тем</span>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Вопрос {current + 1} из {questions.length}</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-600 dark:bg-cyan-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {topicLabels[q.topic] || q.topic}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400">
              {q.difficulty}
            </span>
            {q.type === 'ai-generated' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 flex items-center gap-1">
                <Sparkles size={10} /> ИИ
              </span>
            )}
          </div>

          <h2 className="text-base font-medium text-slate-900 dark:text-white mb-5 leading-relaxed">{q.question}</h2>

          <div className="space-y-2">
            {q.options.map((opt, i) => {
              let optClass = 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              if (answered) {
                if (i === q.correctAnswer) optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600'
                else if (i === selected && !isCorrect) optClass = 'border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-600'
                else optClass = 'border-slate-200 dark:border-slate-800 opacity-50'
              } else if (i === selected) {
                optClass = 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950 dark:border-cyan-600'
              }

              return (
                <button
                  key={i}
                  data-testid={`option-${i}`}
                  disabled={answered}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all flex items-start gap-3 ${optClass}`}
                >
                  <span className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{opt}</span>
                </button>
              )
            })}
          </div>

          {answered && (
            <div className={`mt-5 p-4 rounded-lg ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /> : <XCircle size={18} className="text-red-600 dark:text-red-400" />}
                <span className={`text-sm font-medium ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                  {isCorrect ? 'Правильно' : 'Неправильно'}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{q.explanation}</p>
              {q.regulation && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">Нормативная база: {q.regulation}</p>
              )}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            {!answered ? (
              <button
                data-testid="submit-answer"
                onClick={submitAnswer}
                disabled={selected === null}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Ответить
              </button>
            ) : (
              <button
                data-testid="next-question"
                onClick={nextQuestion}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {current < questions.length - 1 ? (<><span>Далее</span><ArrowRight size={16} /></>) : 'Завершить тест'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const totalCorrect = answers.filter(a => a.correct).length
  const pct = Math.round(totalCorrect / questions.length * 100)
  const level = getLevel(pct)

  const topicResults = {}
  answers.forEach((a, i) => {
    const topic = questions[i]?.topic
    if (!topicResults[topic]) topicResults[topic] = { correct: 0, total: 0 }
    topicResults[topic].total++
    if (a.correct) topicResults[topic].correct++
  })

  const strong = Object.entries(topicResults).filter(([, v]) => v.correct / v.total >= 0.7).map(([k]) => topicLabels[k] || k)
  const weak = Object.entries(topicResults).filter(([, v]) => v.correct / v.total < 0.7).map(([k]) => topicLabels[k] || k)
  const weakIds = Object.entries(topicResults).filter(([, v]) => v.correct / v.total < 0.7).map(([k]) => k)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center">
        {isAiQuiz && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
            <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Результаты ИИ-тренировки</span>
          </div>
        )}

        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Результаты теста</h1>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${level.bg} ${level.color}`}>
          <Award size={18} />
          {level.label}
        </div>

        <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{totalCorrect} / {questions.length}</div>
        <div className="text-lg text-slate-500 dark:text-slate-400 mb-6">{pct}% правильных ответов</div>

        <div className="w-32 h-32 mx-auto mb-6 relative">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-200 dark:text-slate-800" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${pct}, 100`}
              className={pct >= 61 ? 'text-emerald-500' : pct >= 41 ? 'text-amber-500' : 'text-red-500'} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{pct}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-6">
          {strong.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} /> Сильные стороны
              </h3>
              <ul className="space-y-1">
                {strong.map(s => <li key={s} className="text-sm text-emerald-600 dark:text-emerald-400">• {s}</li>)}
              </ul>
            </div>
          )}
          {weak.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                <XCircle size={16} /> Зоны для улучшения
              </h3>
              <ul className="space-y-1">
                {weak.map(w => <li key={w} className="text-sm text-amber-600 dark:text-amber-400">• {w}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-left mb-6">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Рекомендации</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {pct < 60 && <li>• Пройдите раздел «Обучающие материалы» для укрепления базовых знаний</li>}
            {weak.includes('Фишинг и социальная инженерия') && <li>• Изучите раздел «Фишинговые сценарии» — практика распознавания атак</li>}
            {weak.includes('Парольная политика') && <li>• Настройте менеджер паролей и включите MFA на всех аккаунтах</li>}
            {weak.includes('Защита персональных данных (152-ФЗ)') && <li>• Ознакомьтесь с требованиями 152-ФЗ в разделе «Обучение»</li>}
            {pct >= 80 && <li>• Отличный результат. Помогите коллегам — поделитесь ссылкой на платформу</li>}
            <li>• Регулярно повторяйте тестирование для поддержания осведомлённости</li>
          </ul>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-purple-500" />
            ИИ-функции (GigaChat)
          </h3>

          {!apiKeyConfigured ? (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-amber-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">API-ключ не настроен</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Для использования ИИ-анализа и генерации вопросов настройте ключ GigaChat API.
              </p>
              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
              >
                <Settings size={14} />
                Перейти в настройки
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => handleAiFeedback(topicResults)}
                disabled={aiFeedbackLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {aiFeedbackLoading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                {aiFeedbackLoading ? 'Анализ...' : 'ИИ-анализ'}
              </button>

              {aiFeedback && (
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 text-left">
                  <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                    <BrainCircuit size={14} /> Персональные рекомендации ИИ
                  </h4>
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {aiFeedback}
                  </div>
                </div>
              )}

              {aiFeedbackError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                  <XCircle size={14} /> {aiFeedbackError}
                </div>
              )}

              {weakIds.length > 0 && (
                <button
                  onClick={() => handleAiTraining(weakIds)}
                  disabled={aiTrainingLoading}
                  className="w-full py-2.5 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 disabled:opacity-50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {aiTrainingLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {aiTrainingLoading ? 'Генерация вопросов...' : 'Тренировка слабых тем'}
                </button>
              )}

              {aiTrainingError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                  <XCircle size={14} /> {aiTrainingError}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button data-testid="retry-quiz" onClick={reset} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Пройти снова
          </button>
          <Link to="/" data-testid="go-home" className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            <Home size={16} /> На главную
          </Link>
        </div>
      </div>
    </div>
  )
}

function Award({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  )
}
