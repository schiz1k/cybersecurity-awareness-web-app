import { leaderboard } from '../data/siteData'
import type {
  AttemptPayload,
  CyberTest,
  LeaderboardEntry,
  StoredAttempt,
  TierName,
} from '../types'

const tierThresholds: Array<{ name: TierName; min: number }> = [
  { name: 'Легенда', min: 940 },
  { name: 'Алмаз', min: 880 },
  { name: 'Золото', min: 800 },
  { name: 'Серебро', min: 700 },
  { name: 'Бронза', min: 0 },
]

export function getTierByScore(score: number): TierName {
  return tierThresholds.find((tier) => score >= tier.min)?.name ?? 'Бронза'
}

export function createAttempt(test: CyberTest, payload: AttemptPayload): StoredAttempt {
  return {
    id: `${test.slug}-${Date.now()}`,
    testSlug: test.slug,
    score: Math.max(0, Math.round(payload.score)),
    label: payload.label,
    summary: payload.summary,
    tier: getTierByScore(payload.score),
    createdAt: new Date().toISOString(),
  }
}

export function getBestAttempt(testSlug: string, attempts: StoredAttempt[]) {
  return attempts
    .filter((attempt) => attempt.testSlug === testSlug)
    .sort((left, right) => right.score - left.score)[0]
}

export function getAverageScore(attempts: StoredAttempt[]) {
  if (attempts.length === 0) {
    return 0
  }

  const total = attempts.reduce((sum, attempt) => sum + attempt.score, 0)
  return Math.round(total / attempts.length)
}

export function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatScore(score: number) {
  return score.toLocaleString('ru-RU')
}

export function getRecommendedTests(allTests: CyberTest[], attempts: StoredAttempt[]) {
  return allTests
    .filter((test) => test.status === 'playable')
    .sort((left, right) => {
      const leftBest = getBestAttempt(left.slug, attempts)?.score ?? 0
      const rightBest = getBestAttempt(right.slug, attempts)?.score ?? 0
      return leftBest - rightBest
    })
    .slice(0, 3)
}

export function buildPersonalLeaderboard(
  learnerName: string,
  role: string,
  attempts: StoredAttempt[],
): LeaderboardEntry[] {
  const bestScore = attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0)

  if (!bestScore) {
    return leaderboard
  }

  const you: LeaderboardEntry = {
    name: learnerName,
    squad: role,
    city: 'Локальный профиль',
    track: 'Custom',
    tier: getTierByScore(bestScore),
    score: bestScore,
    delta: '+∞',
  }

  return [...leaderboard, you].sort((left, right) => right.score - left.score)
}
