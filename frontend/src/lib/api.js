const API_ROOT = '__PORT_5000__';
const BASE = (API_ROOT.startsWith('__') ? '' : API_ROOT) + '/api'

export async function fetchQuestions(difficulty, topics, count) {
  const params = new URLSearchParams()
  if (difficulty) params.set('difficulty', difficulty)
  if (topics && topics.length) topics.forEach(t => params.append('topics', t))
  if (count) params.set('count', count.toString())
  const res = await fetch(`${BASE}/questions?${params}`)
  if (!res.ok) throw new Error('Failed to fetch questions')
  return res.json()
}

export async function saveResult(result) {
  const res = await fetch(`${BASE}/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  })
  if (!res.ok) throw new Error('Failed to save result')
  return res.json()
}

export async function fetchResults() {
  const res = await fetch(`${BASE}/results`)
  if (!res.ok) throw new Error('Failed to fetch results')
  return res.json()
}

export async function fetchStats() {
  const res = await fetch(`${BASE}/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function generatePhishing(params) {
  const res = await fetch(`${BASE}/phishing/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  if (!res.ok) throw new Error('Failed to generate phishing')
  return res.json()
}

// --- AI API functions ---

export async function setApiKey(apiKey) {
  const res = await fetch(`${BASE}/settings/api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  })
  if (!res.ok) throw new Error('Failed to set API key')
  return res.json()
}

export async function getApiKeyStatus() {
  const res = await fetch(`${BASE}/settings/api-key/status`)
  if (!res.ok) throw new Error('Failed to get API key status')
  return res.json()
}

export async function generateAIQuestions(weakTopics, difficulty, count) {
  const res = await fetch(`${BASE}/ai/generate-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weakTopics, difficulty, count })
  })
  if (!res.ok) throw new Error('Failed to generate AI questions')
  return res.json()
}

export async function generateAIFeedback(score, total, topicResults) {
  const res = await fetch(`${BASE}/ai/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, total, topicResults })
  })
  if (!res.ok) throw new Error('Failed to generate AI feedback')
  return res.json()
}

export async function generateAIPhishing(type, difficulty, trigger) {
  const res = await fetch(`${BASE}/ai/phishing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, difficulty, trigger })
  })
  if (!res.ok) throw new Error('Failed to generate AI phishing')
  return res.json()
}
