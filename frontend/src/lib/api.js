const API_ROOT = '__PORT_5000__'
const BASE = (API_ROOT.startsWith('__') ? '' : API_ROOT) + '/api'

function getCsrfToken() {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))

  if (!cookie) return null
  return decodeURIComponent(cookie.split('=')[1])
}

async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = { ...(options.headers || {}) }

  let body = options.body

  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    body = JSON.stringify(body)
    headers['Content-Type'] = 'application/json'
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    method,
    headers,
    body,
    credentials: 'include'
  })

  const contentType = res.headers.get('content-type') || ''
  let payload = null

  if (contentType.includes('application/json')) {
    payload = await res.json()
  } else {
    payload = await res.text()
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && payload.error) ||
      (payload && typeof payload === 'object' && payload.message) ||
      (typeof payload === 'string' && payload) ||
      'Ошибка запроса'
    throw new Error(message)
  }

  return payload
}

// auth
export function register(username, email, password) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: { username, email, password }
  })
}

export function login(username, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: { username, password }
  })
}

export function fetchMe() {
  return apiFetch('/auth/me')
}

export function logout() {
  return apiFetch('/auth/logout', {
    method: 'POST'
  })
}

// quiz
export async function fetchQuestions(difficulty, topics, count) {
  const params = new URLSearchParams()

  if (difficulty) params.set('difficulty', difficulty)
  if (topics && topics.length) {
    topics.forEach(topic => params.append('topics', topic))
  }
  if (count) params.set('count', String(count))

  const query = params.toString()
  return apiFetch(`/questions${query ? `?${query}` : ''}`)
}

export function saveResult(result) {
  return apiFetch('/results', {
    method: 'POST',
    body: result
  })
}

export function fetchResults() {
  return apiFetch('/results')
}

export function fetchStats() {
  return apiFetch('/stats')
}

// phishing
export function generatePhishing(params) {
  return apiFetch('/phishing/generate', {
    method: 'POST',
    body: params
  })
}

// settings
export function setApiKey(apiKey) {
  return apiFetch('/settings/api-key', {
    method: 'POST',
    body: { apiKey }
  })
}

export function getApiKeyStatus() {
  return apiFetch('/settings/api-key/status')
}

// ai
export function generateAIQuestions(difficulty, count) {
  return apiFetch('/ai/generate-questions/me', {
    method: 'POST',
    body: { difficulty, count }
  })
}

export function generateAIFeedback(score, total, topicResults) {
  return apiFetch('/ai/feedback', {
    method: 'POST',
    body: { score, total, topicResults }
  })
}

export function generateAIPhishing() {
  return apiFetch('/ai/phishing/me')
}
