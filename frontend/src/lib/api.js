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
      (typeof payload === 'string' && payload) ||
      'Ошибка запроса'
    throw new Error(message)
  }

  return payload
}

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

export async function saveResult(result) {
  return apiFetch('/results', {
    method: 'POST',
    body: result
  })
}

export async function fetchResults() {
  return apiFetch('/results')
}

export async function fetchStats() {
  return apiFetch('/stats')
}

export async function generatePhishing(params) {
  return apiFetch('/phishing/generate', {
    method: 'POST',
    body: params
  })
}

export async function setApiKey(apiKey) {
  return apiFetch('/settings/api-key', {
    method: 'POST',
    body: { apiKey }
  })
}

export async function getApiKeyStatus() {
  return apiFetch('/settings/api-key/status')
}

export async function generateAIQuestions(difficulty, count) {
  return apiFetch('/ai/generate-questions/me', {
    method: 'POST',
    body: { difficulty, count }
  })
}

export async function generateAIFeedback(score, total, topicResults) {
  return apiFetch('/ai/feedback', {
    method: 'POST',
    body: { score, total, topicResults }
  })
}

export async function generateAIPhishing() {
  return apiFetch('/ai/phishing/me')
}
