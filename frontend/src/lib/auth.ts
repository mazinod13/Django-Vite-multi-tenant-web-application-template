const ACCESS = 'access_token'
const REFRESH = 'refresh_token'
const API = '/api'

export type User = { id: string; username: string; email: string; tenant: string }

export const getAccess = () => localStorage.getItem(ACCESS)
export const getRefresh = () => localStorage.getItem(REFRESH)

function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS, access)
  localStorage.setItem(REFRESH, refresh)
}
function clearTokens() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
}

// POST /api/token/  -> store {access, refresh}
export async function login(username: string, password: string) {
  const res = await fetch(`${API}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  const data = await res.json()
  setTokens(data.access, data.refresh)
  return data
}

// POST /api/logout/  -> blacklist refresh, then clear local tokens
export async function logout() {
  const refresh = getRefresh()
  if (refresh) {
    await fetch(`${API}/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccess()}`,
      },
      body: JSON.stringify({ refresh }),
    }).catch(() => {})
  }
  clearTokens()
}

// POST /api/token/refresh/  -> new access token (or null if refresh is dead)
async function refreshAccess(): Promise<string | null> {
  const refresh = getRefresh()
  if (!refresh) return null
  const res = await fetch(`${API}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  if (!res.ok) {
    clearTokens()
    return null
  }
  const data = await res.json()
  localStorage.setItem(ACCESS, data.access)
  if (data.refresh) localStorage.setItem(REFRESH, data.refresh)
  return data.access
}

// fetch wrapper: adds the Bearer header; on 401 it refreshes once and retries
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = { ...options.headers, Authorization: `Bearer ${getAccess()}` }
  let res = await fetch(`${API}${path}`, { ...options, headers })
  if (res.status === 401) {
    const newAccess = await refreshAccess()
    if (!newAccess) return res
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${newAccess}` },
    })
  }
  return res
}

// GET /api/me/  -> the user, or null if not authenticated
export async function fetchMe(): Promise<User | null> {
  const res = await authFetch('/me/')
  if (!res.ok) return null
  return res.json()
}

// POST /api/register/  -> create account
export async function register(username: string, email: string, password: string) {
  const res = await fetch(`${API}/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    // turn DRF's {field: [msgs]} into a readable string
    throw new Error(Object.values(data).flat().join(' ') || 'Registration failed')
  }
  return res.json()
}

// POST /api/password-reset/  -> always resolves (backend never reveals if email exists)
export async function requestPasswordReset(email: string) {
  await fetch(`${API}/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}
