import type { StoredAttempt } from '../../types'

export const awarenessGameSlugs = [
  'secure-password-lab',
  'phishing-recognition-lab',
  'privacy-settings-lab',
] as const

export interface AwarenessRank {
  title: string
  badge: string
  summary: string
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(1000, Math.round(value)))
}

export function getAwarenessProgress(attempts: StoredAttempt[]) {
  const completed = awarenessGameSlugs.filter((slug) =>
    attempts.some((attempt) => attempt.testSlug === slug),
  ).length

  return {
    completed,
    total: awarenessGameSlugs.length,
  }
}

export function getAwarenessRank(score: number): AwarenessRank {
  if (score >= 880) {
    return {
      title: 'Кибер-грамотный пользователь',
      badge: 'Эксперт цифровой гигиены',
      summary: 'Вы уверенно замечаете риски и выбираете сильные защитные привычки.',
    }
  }

  if (score >= 720) {
    return {
      title: 'Защитник данных',
      badge: 'Хранитель безопасности',
      summary: 'База уже сильная: осталось добить редкие пограничные случаи.',
    }
  }

  if (score >= 520) {
    return {
      title: 'Внимательный пользователь',
      badge: 'Наблюдатель рисков',
      summary: 'Вы уже видите основные угрозы, но часть решений пока нестабильна.',
    }
  }

  return {
    title: 'Новичок',
    badge: 'Старт обучения',
    summary: 'Начало хорошее: сейчас важнее закрепить базовые сигналы и безопасные настройки.',
  }
}

export function formatAwarenessProgress(completed: number, total: number) {
  return `${completed}/${total} мини-игры`
}
