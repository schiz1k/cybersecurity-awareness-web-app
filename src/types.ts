export type GameMode =
  | 'reflex'
  | 'sequence'
  | 'priority'
  | 'quiz'
  | 'password'
  | 'phishing'
  | 'privacy'

export type TierName = 'Бронза' | 'Серебро' | 'Золото' | 'Алмаз' | 'Легенда'

export type TestDifficulty = 'База' | 'Средний' | 'Продвинутый'

export interface QuizQuestion {
  prompt: string
  options: string[]
  answer: number
  explanation: string
  hint?: string
}

export interface CyberTest {
  slug: string
  title: string
  headline: string
  tag: string
  category: string
  description: string
  difficulty: TestDifficulty
  duration: string
  metric: string
  accent: string
  benefits: string[]
  deck: string[]
  mode: GameMode
  status: 'playable' | 'draft'
  questions?: QuizQuestion[]
}

export interface MaterialItem {
  slug: string
  title: string
  category: string
  level: string
  readTime: string
  summary: string
  highlights: string[]
  body: string[]
}

export interface LearningTopic {
  title: string
  description: string
  level: TestDifficulty
  duration: string
  materialSlugs: string[]
  trainingSlugs: string[]
}

export interface ContentBundle {
  tests: CyberTest[]
  materials: MaterialItem[]
}

export interface LeaderboardEntry {
  name: string
  squad: string
  city: string
  track: string
  tier: TierName
  score: number
  delta: string
}

export interface TierInfo {
  name: TierName
  percentile: string
  title: string
  description: string
}

export interface HeroStat {
  label: string
  value: string
  detail: string
}

export interface StoredAttempt {
  id: string
  testSlug: string
  score: number
  label: string
  summary: string
  tier: TierName
  createdAt: string
}

export interface PlatformState {
  accountEmail: string
  learnerName: string
  role: string
  completedMaterials: string[]
  bookmarkedMaterials: string[]
  attempts: StoredAttempt[]
}

export interface AttemptPayload {
  score: number
  label: string
  summary: string
}

export interface UserRegistrationPayload {
  email: string
  password: string
  displayName: string
  city?: string
  primaryTrack?: string
}

export interface RegisteredUser {
  id: string
  email: string
  display_name: string
  city: string | null
  primary_track: string | null
  role: 'student' | 'instructor' | 'admin'
  team_id: string | null
  created_at: string
}

export interface AuthSessionResponse {
  sessionToken: string
  state: PlatformState
}
