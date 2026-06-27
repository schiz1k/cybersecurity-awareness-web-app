export interface NavigationLink {
  to: string
  label: string
}

export const navigationLinks: NavigationLink[] = [
  { to: '/', label: 'Главная' },
  { to: '/tests', label: 'Тренировки' },
  { to: '/leaderboard', label: 'Рейтинг' },
  { to: '/materials', label: 'Материалы' },
  { to: '/about', label: 'О нас' },
  { to: '/profile', label: 'Профиль' },
]
