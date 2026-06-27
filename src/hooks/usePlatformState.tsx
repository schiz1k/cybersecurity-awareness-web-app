/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useEffect, useState } from 'react'
import {
  clearStoredSessionToken,
  getStoredSessionToken,
  hasStoredSessionToken,
  setStoredSessionToken,
} from '../config/api'
import type {
  AuthSessionResponse,
  PlatformState,
  StoredAttempt,
  UserRegistrationPayload,
} from '../types'
import { apiGet, apiSend } from '../utils/api'
import { useLeaderboardState } from './useLeaderboardState'

const defaultState: PlatformState = {
  accountEmail: '',
  learnerName: 'Ваш профиль',
  role: 'Cybersecurity Team',
  completedMaterials: [],
  bookmarkedMaterials: [],
  attempts: [],
}

const LOCAL_PLATFORM_STATE_KEY = 'cyber-arena-local-platform-state'

function readLocalState(): PlatformState {
  if (typeof window === 'undefined') {
    return defaultState
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_PLATFORM_STATE_KEY)
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState
  } catch {
    return defaultState
  }
}

function writeLocalState(nextState: PlatformState) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCAL_PLATFORM_STATE_KEY, JSON.stringify(nextState))
  }
}

interface PlatformContextValue {
  state: PlatformState
  currentUserEmail: string
  hasRegisteredAccount: boolean
  registerUser: (payload: UserRegistrationPayload) => Promise<void>
  loginUser: (payload: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  saveAttempt: (attempt: StoredAttempt) => Promise<void>
  toggleBookmark: (slug: string) => Promise<void>
  markMaterialComplete: (slug: string) => Promise<void>
  updateProfile: (payload: Pick<PlatformState, 'learnerName' | 'role'>) => Promise<void>
}

const PlatformContext = createContext<PlatformContextValue | null>(null)

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlatformState>(defaultState)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [hasRegisteredAccount, setHasRegisteredAccount] = useState(hasStoredSessionToken())
  const { refreshLeaderboard } = useLeaderboardState()

  const refreshState = async () => {
    const storedToken = getStoredSessionToken() ?? ''
    setHasRegisteredAccount(Boolean(storedToken))

    if (!storedToken) {
      setCurrentUserEmail('')
      setState(readLocalState())
      return
    }

    try {
      const nextState = await apiGet<PlatformState>('/users/current/state')
      setState(nextState)
      setCurrentUserEmail(nextState.accountEmail)
    } catch {
      clearStoredSessionToken()
      setCurrentUserEmail('')
      setHasRegisteredAccount(false)
      setState(defaultState)
    }
  }

  useEffect(() => {
    void refreshState()
  }, [])

  const ensureRegisteredAccount = () => {
    if (hasStoredSessionToken()) {
      return true
    }

    return false
  }

  const updateLocalState = (updater: (current: PlatformState) => PlatformState) => {
    const next = updater(state)
    setState(next)
    writeLocalState(next)
  }

  const value: PlatformContextValue = {
    state,
    currentUserEmail,
    hasRegisteredAccount,
    registerUser: async (payload) => {
      const session = await apiSend<AuthSessionResponse>(
        '/users/register',
        'POST',
        payload,
        { omitAuth: true },
      )
      setStoredSessionToken(session.sessionToken)
      setCurrentUserEmail(session.state.accountEmail)
      setHasRegisteredAccount(true)
      setState(session.state)
      await refreshLeaderboard()
    },
    loginUser: async (payload) => {
      const session = await apiSend<AuthSessionResponse>(
        '/users/login',
        'POST',
        payload,
        { omitAuth: true },
      )
      setStoredSessionToken(session.sessionToken)
      setCurrentUserEmail(session.state.accountEmail)
      setHasRegisteredAccount(true)
      setState(session.state)
      await refreshLeaderboard()
    },
    logout: async () => {
      try {
        await apiSend<void>('/users/logout', 'POST')
      } catch {
        // Ignore logout failures and clear the local session anyway.
      }

      clearStoredSessionToken()
      setCurrentUserEmail('')
      setHasRegisteredAccount(false)
      setState(defaultState)
    },
    saveAttempt: async (attempt) => {
      if (!ensureRegisteredAccount()) {
        updateLocalState((current) => ({
          ...current,
          attempts: [attempt, ...current.attempts.filter((item) => item.id !== attempt.id)].slice(0, 30),
        }))
        return
      }

      const next = await apiSend<PlatformState>(
        `/users/current/tests/${attempt.testSlug}/attempts`,
        'POST',
        {
          score: attempt.score,
          label: attempt.label,
          summary: attempt.summary,
        },
      )
      setState(next)
      setCurrentUserEmail(next.accountEmail)
      await refreshLeaderboard()
    },
    toggleBookmark: async (slug) => {
      if (!ensureRegisteredAccount()) {
        updateLocalState((current) => {
          const bookmarked = current.bookmarkedMaterials.includes(slug)
          return {
            ...current,
            bookmarkedMaterials: bookmarked
              ? current.bookmarkedMaterials.filter((item) => item !== slug)
              : [slug, ...current.bookmarkedMaterials],
          }
        })
        return
      }

      const next = await apiSend<PlatformState>(`/users/current/bookmarks/${slug}/toggle`, 'POST')
      setState(next)
      setCurrentUserEmail(next.accountEmail)
    },
    markMaterialComplete: async (slug) => {
      if (!ensureRegisteredAccount()) {
        updateLocalState((current) => ({
          ...current,
          completedMaterials: current.completedMaterials.includes(slug)
            ? current.completedMaterials
            : [slug, ...current.completedMaterials],
        }))
        return
      }

      const next = await apiSend<PlatformState>(`/users/current/materials/${slug}/complete`, 'POST')
      setState(next)
      setCurrentUserEmail(next.accountEmail)
    },
    updateProfile: async ({ learnerName, role }) => {
      if (!ensureRegisteredAccount()) {
        updateLocalState((current) => ({ ...current, learnerName, role }))
        return
      }

      const next = await apiSend<PlatformState>('/users/current/profile', 'PATCH', {
        learnerName,
        role,
      })
      setState(next)
      setCurrentUserEmail(next.accountEmail)
      await refreshLeaderboard()
    },
  }

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}

export function usePlatformState() {
  const context = useContext(PlatformContext)

  if (!context) {
    throw new Error('usePlatformState must be used inside PlatformProvider')
  }

  return context
}
