import { API_URL, getStoredSessionToken } from '../config/api'

interface ApiRequestOptions {
  omitAuth?: boolean
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function apiGet<T>(path: string, options?: ApiRequestOptions) {
  const token = getStoredSessionToken()
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(options?.omitAuth || !token ? {} : { Authorization: `Bearer ${token}` }),
    },
  })

  return parseResponse<T>(response)
}

export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
  options?: ApiRequestOptions,
) {
  const token = getStoredSessionToken()
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.omitAuth || !token ? {} : { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return parseResponse<T>(response)
}
