export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export const SESSION_TOKEN_STORAGE_KEY = 'cyber-arena-session-token'

export function getStoredSessionToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)
}

export function hasStoredSessionToken() {
  return Boolean(getStoredSessionToken())
}

export function setStoredSessionToken(token: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token)
  }
}

export function clearStoredSessionToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY)
  }
}
