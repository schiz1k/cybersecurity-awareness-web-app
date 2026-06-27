/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useEffect, useState } from 'react'
import { leaderboard as seedLeaderboard } from '../data/siteData'
import type { LeaderboardEntry } from '../types'
import { apiGet } from '../utils/api'

interface LeaderboardContextValue {
  leaderboard: LeaderboardEntry[]
  refreshLeaderboard: () => Promise<void>
}

const LeaderboardContext = createContext<LeaderboardContextValue | null>(null)

export function LeaderboardProvider({ children }: { children: React.ReactNode }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(seedLeaderboard)

  const refreshLeaderboard = async () => {
    try {
      const next = await apiGet<LeaderboardEntry[]>('/leaderboard/current')
      if (next.length) {
        setLeaderboard(next)
      }
    } catch {
      setLeaderboard(seedLeaderboard)
    }
  }

  useEffect(() => {
    void refreshLeaderboard()
  }, [])

  return (
    <LeaderboardContext.Provider value={{ leaderboard, refreshLeaderboard }}>
      {children}
    </LeaderboardContext.Provider>
  )
}

export function useLeaderboardState() {
  const context = useContext(LeaderboardContext)

  if (!context) {
    throw new Error('useLeaderboardState must be used inside LeaderboardProvider')
  }

  return context
}
